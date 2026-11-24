"use client";

import { useCallback, useState } from "react";
import type { UsePdfCanvasReturn, UseSpecEditorReturn, UseWorkspaceActionsReturn } from "@/types/editor";
import type { DatabaseBackupPayload, DrawingRecord, PatchDrawingMetaPayload, ToastKind } from "@/types/ppap";
import type { UseDrawingDatabaseReturn } from "./useDrawingDatabase";
import { renderCompositeDrawingDataUrl } from "@/utils/compositeRenderer";
import { type DrawingValidationResult, validateDrawingForSave } from "@/utils/drawingValidator";
import { blobToDataUrl } from "@/utils/pdfLoader";
import { buildTransferJson, parseTransferJsonText } from "@/utils/transferJson";
import { buildExportFilename, downloadDataUrlFile, downloadJsonPayload, requestWordExport } from "@/utils/wordExportClient";

interface UseWorkspaceActionsParams {
  canvas: UsePdfCanvasReturn;
  db: UseDrawingDatabaseReturn;
  editor: UseSpecEditorReturn;
  showToast: (msg: string, kind?: ToastKind) => void;
}

/**
 * 封裝工作區跨模組操作：存檔、另存、載入、JSON 移轉匯出/匯入、PNG 下載與備份還原
 */
export function useWorkspaceActions({
  canvas,
  db,
  editor,
  showToast,
}: UseWorkspaceActionsParams): UseWorkspaceActionsReturn {
  const [validationResult, setValidationResult] = useState<DrawingValidationResult | null>(null);
  const clearValidation = useCallback((): void => setValidationResult(null), []);

  const getCompositeImage = useCallback((): string | null => {
    if (!canvas.hasMedia || !canvas.baseCanvasRef.current) return null;
    return renderCompositeDrawingDataUrl({
      baseCanvas: canvas.baseCanvasRef.current,
      displayWidth: canvas.displaySize.width,
      zoom: canvas.zoom,
      specifications: editor.page4.specifications,
      balloonStyle: editor.balloonStyle,
      cropRect: editor.cropRect,
    });
  }, [canvas, editor.balloonStyle, editor.cropRect, editor.page4.specifications]);

  const loadRecord = useCallback(
    async (record: DrawingRecord): Promise<void> => {
      editor.hydrateFromRecord(record);
      try {
        await canvas.loadFromServerFile(record.sourceFile, record.sourceFileType, record.pdfPage, record.rotation || 0);
      } catch (err) {
        showToast(err instanceof Error ? err.message : "載入圖紙檔案失敗", "error");
      }
      showToast(`已載入圖紙：${record.partNo}`, "success");
    },
    [canvas, editor, showToast]
  );

  const buildCurrentTransfer = useCallback(
    (overridePartNo?: string) =>
      buildTransferJson({
        page3: overridePartNo ? { ...editor.page3, itemNo: overridePartNo } : editor.page3,
        page4: overridePartNo ? { ...editor.page4, partNumber: overridePartNo } : editor.page4,
        balloonStyle: editor.balloonStyle,
        generalTolerance: editor.generalTolerance,
        cropRect: editor.cropRect,
        sourceFileName: canvas.sourceFileName,
        rotation: canvas.rotation,
        notes: editor.notes,
        compositeImageBase64: getCompositeImage(),
      }),
    [canvas.rotation, canvas.sourceFileName, editor, getCompositeImage]
  );

  const saveToDb = useCallback(
    async (asNew: boolean): Promise<boolean> => {
      const check = validateDrawingForSave(editor.page3, editor.page4, editor.balloonStyle.padZero);
      if (!check.valid) {
        setValidationResult(check);
        showToast(`無法存檔，尚未填寫：${check.missingMessages.join("、")}`, "error");
        return false;
      }
      setValidationResult(null);

      let targetPartNo = editor.page3.itemNo.trim();
      if (asNew) {
        const prompted = prompt("請輸入「另存新料號」的料號名稱：", `${targetPartNo}-NEW`);
        if (!prompted || !prompted.trim()) return false;
        targetPartNo = prompted.trim();
        editor.updatePage3({ itemNo: targetPartNo });
        editor.updatePage4({ partNumber: targetPartNo });
      }

      try {
        let sourceBase64 = canvas.pendingSourceBase64;
        if (asNew && !sourceBase64 && editor.savedSourceFile && !canvas.clearSourceFlag) {
          const resp = await fetch(`/api/files/${encodeURIComponent(editor.savedSourceFile)}`);
          if (resp.ok) sourceBase64 = await blobToDataUrl(await resp.blob());
        }

        const fullTransfer = buildCurrentTransfer(targetPartNo);
        const { balloonedDrawingImageBase64, ...page3WithoutImage } = fullTransfer.page3;

        const saved = await db.saveDrawing({
          id: asNew ? null : editor.drawingId,
          partNo: targetPartNo,
          sourceFileName: canvas.sourceFileName,
          sourceFileType: canvas.sourceFileType,
          sourceFileBase64: sourceBase64,
          clearSourceFile: canvas.clearSourceFlag,
          pdfPage: canvas.pdfPage,
          rotation: canvas.rotation,
          compositeImageBase64: balloonedDrawingImageBase64,
          cropRect: editor.cropRect,
          balloonStyle: editor.balloonStyle,
          generalTolerance: editor.generalTolerance,
          page3: {
            ...page3WithoutImage,
            judgementSyncWithTestStandard: editor.page3.judgementSyncWithTestStandard,
          },
          page4: { ...editor.page4, partNumber: targetPartNo },
          notes: editor.notes,
        });

        editor.setDrawingId(saved.id);
        editor.setSavedSourceFile(saved.sourceFile);
        editor.setIsDirty(false);
        canvas.resetPendingFlags();
        showToast(`已成功儲存「${targetPartNo}」至本地圖紙資料庫`, "success");
        return true;
      } catch (err) {
        showToast(err instanceof Error ? err.message : "儲存失敗", "error");
        return false;
      }
    },
    [buildCurrentTransfer, canvas, db, editor, showToast]
  );

  const patchRecordMeta = useCallback(
    async (id: string, payload: PatchDrawingMetaPayload): Promise<DrawingRecord> => {
      const updated = await db.patchDrawingMeta(id, payload);
      if (editor.drawingId === id) {
        editor.updatePage3(updated.page3);
        editor.updatePage4({ partNumber: updated.page4.partNumber, partName: updated.page4.partName });
        editor.updateNotes(updated.notes);
        editor.setIsDirty(false);
      }
      showToast(`已更新圖紙「${updated.partNo}」資訊`, "success");
      return updated;
    },
    [db, editor, showToast]
  );

  const deleteRecord = useCallback(
    async (record: DrawingRecord): Promise<void> => {
      await db.deleteDrawing(record.id);
      if (editor.drawingId === record.id) editor.setDrawingId(null);
      showToast(`已刪除「${record.partNo}」`, "success");
    },
    [db, editor, showToast]
  );

  const exportTransferJson = useCallback((): void => {
    const partNo = editor.page3.itemNo.trim();
    if (!partNo) { showToast("請先填寫料號再匯出移轉 JSON", "warn"); return; }
    const filename = buildExportFilename("PPAP", partNo, "json");
    downloadJsonPayload(buildCurrentTransfer(), filename, true);
    showToast(`已匯出移轉 JSON：${filename}`, "success");
  }, [buildCurrentTransfer, editor.page3.itemNo, showToast]);

  const exportWordDocx = useCallback(async (): Promise<boolean> => {
    const check = validateDrawingForSave(editor.page3, editor.page4, editor.balloonStyle.padZero);
    if (!check.valid) {
      setValidationResult(check);
      showToast(`無法匯出 Word，尚未填寫：${check.missingMessages.join("、")}`, "error");
      return false;
    }
    setValidationResult(null);
    try {
      const filename = await requestWordExport(buildCurrentTransfer());
      showToast(`已匯出 Word 報告：${filename}`, "success");
      return true;
    } catch (err) {
      const msg = err instanceof Error ? err.message : "匯出 Word 失敗";
      showToast(/failed to fetch/i.test(msg) ? "無法連線到本地伺服器，請確認伺服器執行中" : msg, "error");
      return false;
    }
  }, [buildCurrentTransfer, editor.balloonStyle.padZero, editor.page3, editor.page4, showToast]);

  const importTransferJson = useCallback(async (file: File): Promise<void> => {
    try {
      const parsed = parseTransferJsonText(await file.text());
      editor.hydrateFromImported(parsed);
      if (parsed.imageBase64) {
        await canvas.loadFromDataUrl(parsed.imageBase64, `${parsed.page3.itemNo || "imported"}_drawing.png`, "image");
      } else {
        canvas.removeSourceMedia();
      }
      showToast(`已成功匯入 JSON：${parsed.page3.itemNo}`, "success");
    } catch (err) {
      showToast(err instanceof Error ? err.message : "匯入 JSON 失敗", "error");
    }
  }, [canvas, editor, showToast]);

  const downloadCompositePng = useCallback((): void => {
    const dataUrl = getCompositeImage();
    if (!dataUrl) { showToast("尚未載入工程圖，無法下載球標圖", "warn"); return; }
    const safePart = (editor.page3.itemNo || "drawing").replace(/[^a-zA-Z0-9._-]/g, "_");
    downloadDataUrlFile(dataUrl, `${safePart}_ballooned.png`);
    showToast("已下載合成球標圖 PNG", "success");
  }, [editor.page3.itemNo, getCompositeImage, showToast]);

  const backupDatabase = useCallback(async (): Promise<void> => {
    try {
      const backup = await db.exportBackup();
      downloadJsonPayload(backup, buildExportFilename("PPAP_DrawingDB", "Backup", "json"));
      showToast("已匯出完整圖紙資料庫備份", "success");
    } catch (err) {
      showToast(err instanceof Error ? err.message : "匯出備份失敗", "error");
    }
  }, [db, showToast]);

  const restoreDatabaseFile = useCallback(async (file: File): Promise<void> => {
    try {
      const parsed = JSON.parse(await file.text()) as DatabaseBackupPayload;
      const count = await db.restoreBackup(parsed, "merge");
      showToast(`已成功匯入 ${count} 筆圖紙至資料庫`, "success");
    } catch (err) {
      showToast(err instanceof Error ? err.message : "還原失敗", "error");
    }
  }, [db, showToast]);

  return {
    validationResult, clearValidation, getCompositeImage, loadRecord, saveToDb,
    patchRecordMeta, deleteRecord, exportTransferJson, exportWordDocx, importTransferJson,
    downloadCompositePng, backupDatabase, restoreDatabaseFile,
  };
}
