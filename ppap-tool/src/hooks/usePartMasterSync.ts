"use client";

import { useCallback, useMemo } from "react";
import type { PartMasterItem, ToastKind } from "@/types/ppap";
import type {
  UsePdfCanvasReturn,
  UseSpecEditorReturn,
  UseWorkspaceActionsReturn,
} from "@/types/editor";
import type { UseDrawingDatabaseReturn } from "./useDrawingDatabase";
import type { UsePartMasterLibraryReturn } from "./usePartMasterLibrary";
import { buildLinkedPartIdSet, findMatchingDrawingForPart } from "@/utils/partMasterMatcher";

interface UsePartMasterSyncParams {
  canvas: UsePdfCanvasReturn;
  db: UseDrawingDatabaseReturn;
  partMasterLib: UsePartMasterLibraryReturn;
  editor: UseSpecEditorReturn;
  actions: UseWorkspaceActionsReturn;
  showToast: (msg: string, kind?: ToastKind) => void;
}

export interface UsePartMasterSyncReturn {
  linkedPartIds: Set<string>;
  applyPartMaster: (item: PartMasterItem) => Promise<void>;
  saveCurrentToPartMaster: () => Promise<void>;
}

/**
 * 處理「料號主檔 ↔ 圖紙資料庫」雙向連動：
 * - 選取主檔時，若資料庫已有對應圖紙則連同底圖、球標與規格表一起載入
 * - 若資料庫尚無圖紙：正在編輯舊存檔圖紙則安全切為新空白圖紙；若原本就是未存檔新圖紙則保留底圖只帶入表頭
 */
export function usePartMasterSync({
  canvas,
  db,
  partMasterLib,
  editor,
  actions,
  showToast,
}: UsePartMasterSyncParams): UsePartMasterSyncReturn {
  const linkedPartIds = useMemo(
    () => buildLinkedPartIdSet(partMasterLib.parts, db.drawings),
    [db.drawings, partMasterLib.parts]
  );

  const fillHeaderFromMaster = useCallback(
    (item: PartMasterItem, syncJudgement: boolean): void => {
      editor.updatePage3({
        itemNo: item.partNo,
        testStandard: item.testStandard,
        revision: item.revision,
        issueDate: item.issueDate,
        ...(syncJudgement ? { judgementStandard: item.testStandard } : {}),
      });
      editor.updatePage4({ partNumber: item.partNo, partName: item.partName });
    },
    [editor]
  );

  const applyPartMaster = useCallback(
    async (item: PartMasterItem): Promise<void> => {
      const label = item.partNo || item.testStandard || "主檔";
      const matched = findMatchingDrawingForPart(item, db.drawings);

      if (matched) {
        if (editor.drawingId === matched.id) {
          fillHeaderFromMaster(item, editor.page3.judgementSyncWithTestStandard);
          showToast(`已同步最新主檔資訊至目前圖紙：${label}`, "success");
          return;
        }
        if (
          editor.isDirty &&
          !confirm(`目前圖紙尚有未儲存修改，確定切換並載入「${label}」的圖紙與球標嗎？`)
        ) {
          return;
        }
        await actions.loadRecord(matched);
        const needsHeaderSync =
          (item.partName && item.partName !== matched.page4.partName) ||
          (item.revision && item.revision !== matched.page3.revision) ||
          (item.issueDate && item.issueDate !== matched.page3.issueDate);
        if (needsHeaderSync) {
          fillHeaderFromMaster(item, matched.page3.judgementSyncWithTestStandard !== false);
        }
        return;
      }

      // 圖紙資料庫尚無此料號圖紙：若目前開著別顆已存檔圖紙，避免誤覆蓋舊圖，切為新空白圖紙
      if (editor.drawingId !== null) {
        if (
          editor.isDirty &&
          !confirm(`目前圖紙尚有未儲存修改，資料庫尚無「${label}」圖紙，確定切換為新空白圖紙嗎？`)
        ) {
          return;
        }
        editor.resetBlank();
        canvas.removeSourceMedia();
        fillHeaderFromMaster(item, true);
        showToast(
          `資料庫尚無「${label}」圖紙，已建立新圖紙並帶入主檔（可直接上傳或 Ctrl+V 貼上截圖）`,
          "info"
        );
        return;
      }

      // 目前為未存檔的新圖紙（例如剛貼上截圖準備建檔）：保留底圖與規格，帶入主檔表頭
      fillHeaderFromMaster(item, editor.page3.judgementSyncWithTestStandard);
      showToast(`已帶入主檔表頭：${label}`, "success");
    },
    [actions, canvas, db.drawings, editor, fillHeaderFromMaster, showToast]
  );

  const saveCurrentToPartMaster = useCallback(async (): Promise<void> => {
    try {
      const res = await partMasterLib.addPart({
        partNo: editor.page3.itemNo,
        partName: editor.page4.partName,
        testStandard: editor.page3.testStandard,
        revision: editor.page3.revision,
        issueDate: editor.page3.issueDate,
      });
      showToast(
        res.replacedExisting
          ? `已更新料號主檔「${res.item.partNo || res.item.testStandard}」`
          : `已將「${res.item.partNo || res.item.testStandard}」存進主檔`,
        "success"
      );
    } catch (err) {
      showToast(err instanceof Error ? err.message : "儲存主檔失敗", "error");
    }
  }, [editor.page3, editor.page4.partName, partMasterLib, showToast]);

  return { linkedPartIds, applyPartMaster, saveCurrentToPartMaster };
}
