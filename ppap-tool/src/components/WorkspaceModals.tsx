"use client";

import React from "react";
import type { UseSpecEditorReturn, UseWorkspaceActionsReturn } from "@/types/editor";
import type { ToastKind } from "@/types/ppap";
import type { UseDrawingDatabaseReturn } from "@/hooks/useDrawingDatabase";
import type { UseEquipmentLibraryReturn } from "@/hooks/useEquipmentLibrary";
import type { UseSymbolLibraryReturn } from "@/hooks/useSymbolLibrary";
import type { UseToleranceLibraryReturn } from "@/hooks/useToleranceLibrary";
import type { UsePartMasterLibraryReturn } from "@/hooks/usePartMasterLibrary";
import type { PartMasterItem } from "@/types/ppap";
import { DatabaseModal } from "./DatabaseModal";
import { PasteSpecModal } from "./PasteSpecModal";
import { EquipmentLibraryModal } from "./EquipmentLibraryModal";
import { SymbolLibraryModal } from "./SymbolLibraryModal";
import { GeneralToleranceModal } from "./GeneralToleranceModal";
import { PartMasterModal } from "./PartMasterModal";

export type ActiveModalKey = "db" | "paste" | "equip" | "symbol" | "tolerance" | "parts" | null;

interface WorkspaceModalsProps {
  activeModal: ActiveModalKey;
  onCloseModal: () => void;
  db: UseDrawingDatabaseReturn;
  equip: UseEquipmentLibraryReturn;
  symbolLib: UseSymbolLibraryReturn;
  toleranceLib: UseToleranceLibraryReturn;
  partMasterLib: UsePartMasterLibraryReturn;
  linkedPartIds: Set<string>;
  onApplyPartMaster: (item: PartMasterItem) => void;
  editor: UseSpecEditorReturn;
  actions: UseWorkspaceActionsReturn;
  showToast: (msg: string, kind?: ToastKind) => void;
}

export function WorkspaceModals({
  activeModal,
  onCloseModal,
  db,
  equip,
  symbolLib,
  toleranceLib,
  partMasterLib,
  linkedPartIds,
  onApplyPartMaster,
  editor,
  actions,
  showToast,
}: WorkspaceModalsProps): React.ReactElement {
  return (
    <>
      <DatabaseModal
        isOpen={activeModal === "db"}
        currentDrawingId={editor.drawingId}
        onClose={onCloseModal}
        onSearch={db.fetchDrawings}
        onLoadDrawing={async (rec) => {
          if (editor.isDirty && !confirm("目前圖紙有未儲存修改，確定切換載入嗎？")) return;
          await actions.loadRecord(rec);
        }}
        onPatchDrawingMeta={actions.patchRecordMeta}
        onDeleteDrawing={actions.deleteRecord}
        onBackupDb={actions.backupDatabase}
        onRestoreDbFile={actions.restoreDatabaseFile}
      />

      <PasteSpecModal
        isOpen={activeModal === "paste"}
        defaultQty={editor.page3.sampleQtyNumber || 5}
        padZero={editor.balloonStyle.padZero}
        onClose={onCloseModal}
        onApply={(rows, replaceMode) => {
          editor.applyPastedSpecs(rows, replaceMode);
          showToast(`已成功匯入 ${rows.length} 項規格值！`, "success");
        }}
        onNotify={showToast}
      />

      <EquipmentLibraryModal
        isOpen={activeModal === "equip"}
        equipmentList={equip.equipmentList}
        onClose={onCloseModal}
        onAdd={async (label) => {
          await equip.addEquipment(label);
          showToast("已新增常用測試儀器", "success");
        }}
        onUpdate={async (id, label) => {
          await equip.updateEquipment(id, label);
          showToast("已更新測試儀器名稱", "success");
        }}
        onDelete={async (id) => {
          await equip.deleteEquipment(id);
          showToast("已刪除常用測試儀器", "success");
        }}
        onInsertToReport={(label) => {
          if (!editor.page3.testEquipment.includes(label)) {
            editor.updatePage3({ testEquipment: [...editor.page3.testEquipment, label] });
            showToast("已加入本報告測試儀器清單", "success");
          }
        }}
      />

      <SymbolLibraryModal
        isOpen={activeModal === "symbol"}
        symbols={symbolLib.symbols}
        onClose={onCloseModal}
        onAdd={async (payload) => {
          await symbolLib.addSymbol(payload);
          showToast(`已新增快速符號「${payload.label}」`, "success");
        }}
        onUpdate={async (id, payload) => {
          await symbolLib.updateSymbol(id, payload);
          showToast(`已更新快速符號「${payload.label}」`, "success");
        }}
        onDelete={async (id) => {
          await symbolLib.deleteSymbol(id);
          showToast("已刪除快速符號", "success");
        }}
      />

      <GeneralToleranceModal
        isOpen={activeModal === "tolerance"}
        config={editor.generalTolerance}
        profiles={toleranceLib.profiles}
        onClose={onCloseModal}
        onApplyToDrawing={(next) => {
          editor.updateGeneralTolerance(next);
          showToast("已更新本圖紙一般公差設定", "success");
        }}
        onAddProfile={async (name, rules) => {
          await toleranceLib.addProfile(name, rules);
          showToast(`已新增一般公差範本「${name}」`, "success");
        }}
        onUpdateProfile={async (id, name, rules) => {
          await toleranceLib.updateProfile(id, name, rules);
          showToast(`已更新一般公差範本「${name}」`, "success");
        }}
        onDeleteProfile={async (id) => {
          await toleranceLib.deleteProfile(id);
          showToast("已刪除一般公差範本", "success");
        }}
      />

      <PartMasterModal
        isOpen={activeModal === "parts"}
        parts={partMasterLib.parts}
        linkedPartIds={linkedPartIds}
        onClose={onCloseModal}
        onApplyPart={onApplyPartMaster}
        onAdd={async (payload) => {
          try {
            const res = await partMasterLib.addPart(payload);
            showToast(
              res.replacedExisting
                ? `已更新料號主檔「${res.item.partNo || res.item.testStandard}」`
                : `已新增料號主檔「${res.item.partNo || res.item.testStandard}」`,
              "success"
            );
          } catch (err) {
            showToast(err instanceof Error ? err.message : "新增料號主檔失敗", "error");
          }
        }}
        onBatchImport={async (items) => {
          try {
            const res = await partMasterLib.batchImportParts(items);
            showToast(
              `批次匯入完成：新增 ${res.addedCount} 筆、更新 ${res.updatedCount} 筆`,
              "success"
            );
            return res;
          } catch (err) {
            showToast(err instanceof Error ? err.message : "批次匯入失敗", "error");
            throw err;
          }
        }}
        onUpdate={async (id, payload) => {
          try {
            await partMasterLib.updatePart(id, payload);
            showToast("已更新料號主檔資料", "success");
          } catch (err) {
            showToast(err instanceof Error ? err.message : "更新料號主檔失敗", "error");
          }
        }}
        onDelete={async (id) => {
          try {
            await partMasterLib.deletePart(id);
            showToast("已刪除料號主檔資料", "success");
          } catch (err) {
            showToast(err instanceof Error ? err.message : "刪除料號主檔失敗", "error");
          }
        }}
      />
    </>
  );
}
