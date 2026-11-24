"use client";

import React, { useEffect, useMemo, useState } from "react";
import type { CanvasMode, HealthResponse } from "@/types/ppap";
import { useToast } from "@/hooks/useToast";
import { usePdfCanvas } from "@/hooks/usePdfCanvas";
import { useDrawingDatabase } from "@/hooks/useDrawingDatabase";
import { useEquipmentLibrary } from "@/hooks/useEquipmentLibrary";
import { useSymbolLibrary } from "@/hooks/useSymbolLibrary";
import { useToleranceLibrary } from "@/hooks/useToleranceLibrary";
import { usePartMasterLibrary } from "@/hooks/usePartMasterLibrary";
import { usePartMasterSync } from "@/hooks/usePartMasterSync";
import { useSpecEditor } from "@/hooks/useSpecEditor";
import { useWorkspaceActions } from "@/hooks/useWorkspaceActions";
import { useWorkspaceShortcuts } from "@/hooks/useWorkspaceShortcuts";
import { formatBalloonLabel } from "@/utils/specFormatter";
import { buildTransferJson } from "@/utils/transferJson";
import { TopBar } from "./TopBar";
import { LeftCanvasPanel } from "./LeftCanvasPanel";
import { RightEditorPanel, type RightTabKey } from "./RightEditorPanel";
import { WorkspaceModals, type ActiveModalKey } from "./WorkspaceModals";
import { ToastContainer } from "./ToastContainer";

export function PpapWorkspace(): React.ReactElement {
  const [hasLocalPdfJs, setHasLocalPdfJs] = useState<boolean>(true);
  const [mode, setMode] = useState<CanvasMode>("balloon");
  const [activeTab, setActiveTab] = useState<RightTabKey>("editor");
  const [previewTick, setPreviewTick] = useState<number>(0);
  const [activeModal, setActiveModal] = useState<ActiveModalKey>(null);

  const { toasts, showToast, dismissToast } = useToast();
  const canvas = usePdfCanvas(hasLocalPdfJs);
  const db = useDrawingDatabase();
  const equip = useEquipmentLibrary();
  const symbolLib = useSymbolLibrary();
  const toleranceLib = useToleranceLibrary();
  const partMasterLib = usePartMasterLibrary();
  const editor = useSpecEditor();
  const actions = useWorkspaceActions({ canvas, db, editor, showToast });
  const partSync = usePartMasterSync({
    canvas,
    db,
    partMasterLib,
    editor,
    actions,
    showToast,
  });

  useEffect(() => {
    let mounted = true;
    const bootstrap = async (): Promise<void> => {
      try {
        const healthRes = await fetch("/api/health");
        if (healthRes.ok) {
          const health = (await healthRes.json()) as HealthResponse;
          if (mounted) setHasLocalPdfJs(Boolean(health.hasLocalPdfJs));
        }
        await Promise.all([
          equip.fetchEquipment(),
          symbolLib.fetchSymbols(),
          toleranceLib.fetchProfiles(),
          partMasterLib.fetchParts(),
        ]);
        const list = await db.fetchDrawings();
        if (mounted && list.length > 0) {
          editor.hydrateFromRecord(list[0]);
          await canvas.loadFromServerFile(
            list[0].sourceFile,
            list[0].sourceFileType,
            list[0].pdfPage,
            list[0].rotation || 0
          );
        }
      } catch (err) {
        console.error("初始化失敗:", err);
      }
    };
    void bootstrap();
    return () => {
      mounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSaveAndSyncParts = async (asNew: boolean): Promise<void> => {
    const ok = await actions.saveToDb(asNew);
    if (!ok) {
      setActiveTab("editor");
      return;
    }
    await partMasterLib.fetchParts().catch(() => {});
  };

  const handleDeleteBalloonAndSpec = (idx: number): void => {
    const target = editor.page4.specifications[idx];
    if (!target) return;
    const label = formatBalloonLabel(target.item, editor.balloonStyle.padZero);
    editor.deleteSpecRow(idx);
    showToast(`已刪除球標 [${label}] 與對應項次並重新順號`, "info");
  };

  useWorkspaceShortcuts({
    selectedRowIndex: editor.selectedRowIndex,
    onEscape: () => {
      editor.setTargetItemIndex(null);
      setActiveModal(null);
    },
    onSave: () => void handleSaveAndSyncParts(false),
    onDeleteSelected: handleDeleteBalloonAndSpec,
  });

  const transferPayload = useMemo(() => {
    void previewTick;
    return buildTransferJson({
      page3: editor.page3,
      page4: editor.page4,
      balloonStyle: editor.balloonStyle,
      generalTolerance: editor.generalTolerance,
      cropRect: editor.cropRect,
      sourceFileName: canvas.sourceFileName,
      rotation: canvas.rotation,
      notes: editor.notes,
      compositeImageBase64: activeTab === "editor" ? null : actions.getCompositeImage(),
    });
  }, [actions, activeTab, canvas.sourceFileName, editor, previewTick]);

  const handleUploadFile = async (file: File): Promise<void> => {
    try {
      await canvas.loadFromFile(file);
      editor.setCropRect(null);
      editor.setIsDirty(true);
      showToast(`已載入圖紙：${file.name}`, "success");
    } catch (err) {
      showToast(err instanceof Error ? err.message : "載入圖檔失敗", "error");
    }
  };

  const docLabel = editor.drawingId
    ? `${editor.page3.itemNo || "未命名"}${
        editor.page3.testStandard ? ` · ${editor.page3.testStandard}` : ""
      }${editor.isDirty ? " (未儲存)" : " (已存檔)"}`
    : editor.page3.itemNo
    ? `${editor.page3.itemNo} (新圖紙)`
    : "新圖紙（未存檔）";

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-slate-100">
      <TopBar
        currentDocLabel={docLabel}
        isDirty={editor.isDirty}
        hasId={Boolean(editor.drawingId)}
        dbCount={db.drawings.length}
        onOpenDb={() => setActiveModal("db")}
        onNewDrawing={() => {
          if (editor.isDirty && !confirm("目前尚有未儲存修改，確定建立新空白圖紙嗎？")) return;
          editor.resetBlank();
          canvas.removeSourceMedia();
        }}
        onImportJsonFile={(f) => void actions.importTransferJson(f)}
        onSaveAsNew={() => void handleSaveAndSyncParts(true)}
        onSaveDb={() => void handleSaveAndSyncParts(false)}
        onExportJson={actions.exportTransferJson}
      />

      <main className="grid flex-1 grid-cols-1 overflow-hidden lg:grid-cols-[1.08fr_1fr]">
        <LeftCanvasPanel
          canvas={canvas}
          editor={editor}
          mode={mode}
          disablePaste={activeModal !== null}
          onModeChange={setMode}
          onUploadFile={(f) => void handleUploadFile(f)}
          onOpenDb={() => setActiveModal("db")}
          onDeleteBalloonAndSpec={handleDeleteBalloonAndSpec}
          onDownloadPng={actions.downloadCompositePng}
          showToast={showToast}
        />

        <RightEditorPanel
          activeTab={activeTab}
          editor={editor}
          equipmentList={equip.equipmentList}
          symbols={symbolLib.symbols}
          toleranceProfiles={toleranceLib.profiles}
          partMasters={partMasterLib.parts}
          linkedPartIds={partSync.linkedPartIds}
          validationResult={actions.validationResult}
          onDismissValidation={actions.clearValidation}
          transferPayload={transferPayload}
          hasMedia={canvas.hasMedia}
          onTabChange={(tab) => {
            setActiveTab(tab);
            setPreviewTick((t) => t + 1);
          }}
          onRefreshPreview={() => setPreviewTick((t) => t + 1)}
          onLocateBalloon={(idx) => {
            setMode("balloon");
            editor.setTargetItemIndex(editor.targetItemIndex === idx ? null : idx);
            editor.setSelectedRowIndex(idx);
          }}
          onApplyPartMaster={(item) => void partSync.applyPartMaster(item)}
          onSaveCurrentToPartMaster={() => void partSync.saveCurrentToPartMaster()}
          onOpenPartMasterManager={() => setActiveModal("parts")}
          onOpenEquipmentManager={() => setActiveModal("equip")}
          onOpenPasteModal={() => setActiveModal("paste")}
          onOpenSymbolManager={() => setActiveModal("symbol")}
          onOpenToleranceModal={() => setActiveModal("tolerance")}
          onDownloadJson={actions.exportTransferJson}
          onNotify={showToast}
        />
      </main>

      <WorkspaceModals
        activeModal={activeModal}
        onCloseModal={() => setActiveModal(null)}
        db={db}
        equip={equip}
        symbolLib={symbolLib}
        toleranceLib={toleranceLib}
        partMasterLib={partMasterLib}
        linkedPartIds={partSync.linkedPartIds}
        onApplyPartMaster={(item) => void partSync.applyPartMaster(item)}
        editor={editor}
        actions={actions}
        showToast={showToast}
      />

      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}
