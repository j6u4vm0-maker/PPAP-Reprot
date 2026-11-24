"use client";

import React from "react";
import type {
  EquipmentItem,
  GeneralToleranceProfile,
  PartMasterItem,
  SymbolItem,
  ToastKind,
  TransferJsonPayload,
} from "@/types/ppap";
import type { UseSpecEditorReturn } from "@/types/editor";
import type { DrawingValidationResult } from "@/utils/drawingValidator";
import { PartMasterPickerBar } from "./PartMasterPickerBar";
import { ValidationErrorBanner } from "./ValidationErrorBanner";
import { HeaderFormCard } from "./HeaderFormCard";
import { SpecTableCard } from "./SpecTableCard";
import { ReportPreviewTab } from "./ReportPreviewTab";
import { JsonPreviewTab } from "./JsonPreviewTab";

export type RightTabKey = "editor" | "preview" | "json";

interface RightEditorPanelProps {
  activeTab: RightTabKey;
  editor: UseSpecEditorReturn;
  equipmentList: EquipmentItem[];
  symbols: SymbolItem[];
  toleranceProfiles: GeneralToleranceProfile[];
  partMasters: PartMasterItem[];
  linkedPartIds: Set<string>;
  validationResult: DrawingValidationResult | null;
  onDismissValidation: () => void;
  transferPayload: TransferJsonPayload;
  hasMedia: boolean;
  onTabChange: (tab: RightTabKey) => void;
  onRefreshPreview: () => void;
  onLocateBalloon: (idx: number) => void;
  onApplyPartMaster: (item: PartMasterItem) => void;
  onSaveCurrentToPartMaster: () => void;
  onOpenPartMasterManager: () => void;
  onOpenEquipmentManager: () => void;
  onOpenPasteModal: () => void;
  onOpenSymbolManager: () => void;
  onOpenToleranceModal: () => void;
  onDownloadJson: () => void;
  onNotify: (msg: string, kind?: ToastKind) => void;
}

const TAB_ITEMS: Array<[RightTabKey, string]> = [
  ["editor", "📝 規格與表頭設定 (P3/P4)"],
  ["preview", "👁️ P3 / P4 報告預覽"],
  ["json", "🧬 移轉 JSON 預覽"],
];

export function RightEditorPanel({
  activeTab,
  editor,
  equipmentList,
  symbols,
  toleranceProfiles,
  partMasters,
  linkedPartIds,
  validationResult,
  onDismissValidation,
  transferPayload,
  hasMedia,
  onTabChange,
  onRefreshPreview,
  onLocateBalloon,
  onApplyPartMaster,
  onSaveCurrentToPartMaster,
  onOpenPartMasterManager,
  onOpenEquipmentManager,
  onOpenPasteModal,
  onOpenSymbolManager,
  onOpenToleranceModal,
  onDownloadJson,
  onNotify,
}: RightEditorPanelProps): React.ReactElement {
  const handleCopySpecsTsv = async (): Promise<void> => {
    if (!editor.page4.specifications.length) {
      onNotify("規格表為空", "warn");
      return;
    }
    const tsv = editor.page4.specifications
      .map(
        (s) =>
          `${s.item}\t${s.dimension}\t${s.tolerancePlus}\t${s.toleranceMinus}\t${s.cavity}\t${s.testQuantity}`
      )
      .join("\n");
    try {
      await navigator.clipboard.writeText(tsv);
      onNotify("已複製 6 欄規格表到剪貼簿", "success");
    } catch {
      onNotify("無法存取剪貼簿", "error");
    }
  };

  const handleCopyJson = async (): Promise<void> => {
    try {
      await navigator.clipboard.writeText(JSON.stringify(transferPayload, null, 2));
      onNotify("已複製完整移轉 JSON 至剪貼簿", "success");
    } catch {
      onNotify("複製失敗，請改用下載按鈕", "error");
    }
  };

  return (
    <section className="flex flex-col overflow-hidden bg-slate-100">
      <div className="flex shrink-0 gap-1 border-b border-slate-200 bg-white px-3">
        {TAB_ITEMS.map(([key, label]) => (
          <button
            key={key}
            type="button"
            onClick={() => onTabChange(key)}
            className={`border-b-2 px-3.5 py-2.5 text-xs font-bold transition ${
              activeTab === key
                ? "border-blue-600 text-blue-700"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="flex flex-1 flex-col gap-3 overflow-y-auto p-3">
        {activeTab === "editor" && (
          <>
            <ValidationErrorBanner
              validation={validationResult}
              onDismiss={onDismissValidation}
            />

            <PartMasterPickerBar
              parts={partMasters}
              linkedPartIds={linkedPartIds}
              canSaveCurrent={Boolean(editor.page3.itemNo.trim() || editor.page3.testStandard.trim())}
              onSelectPart={onApplyPartMaster}
              onSaveCurrentToMaster={onSaveCurrentToPartMaster}
              onOpenManager={onOpenPartMasterManager}
            />

            <HeaderFormCard
              page3={editor.page3}
              page4={editor.page4}
              notes={editor.notes}
              equipmentLibrary={equipmentList}
              invalidFields={validationResult?.invalidFields}
              onChangePage3={editor.updatePage3}
              onChangePage4={editor.updatePage4}
              onChangeNotes={editor.updateNotes}
              onApplyQtyToAllSpecs={(qty) => {
                editor.applyQtyToAllSpecs(qty);
                onNotify(`已將全部規格列的 Test Quantity 設為 ${qty}`, "success");
              }}
              onOpenEquipmentManager={onOpenEquipmentManager}
            />

            <SpecTableCard
              specifications={editor.page4.specifications}
              balloonStyle={editor.balloonStyle}
              generalTolerance={editor.generalTolerance}
              toleranceProfiles={toleranceProfiles}
              symbols={symbols}
              invalidSpecIndices={validationResult?.invalidSpecIndices}
              selectedRowIndex={editor.selectedRowIndex}
              targetItemIndex={editor.targetItemIndex}
              onSelectRow={editor.setSelectedRowIndex}
              onLocateBalloon={(idx) => {
                if (!hasMedia) {
                  onNotify("請先在左側匯入 PDF 或工程圖圖片", "warn");
                  return;
                }
                onLocateBalloon(idx);
              }}
              onAddEmptyRow={editor.addEmptySpec}
              onAddFormulaSpec={(formula) => {
                const ok = editor.addFormulaSpec(formula);
                if (!ok) onNotify("格式不符，請輸入如 3.2±0.1 或 2.5 +0.15/-0.10", "warn");
                return ok;
              }}
              onUpdateSpecField={editor.updateSpecField}
              onMoveRow={editor.moveSpecRow}
              onDeleteRow={editor.deleteSpecRow}
              onClearAllSpecs={() => {
                if (!editor.page4.specifications.length) return;
                if (!confirm("確定清空所有尺寸規格項次與球標嗎？")) return;
                editor.clearAllSpecs();
              }}
              onCopySpecsTsv={() => void handleCopySpecsTsv()}
              onOpenPasteModal={onOpenPasteModal}
              onOpenSymbolManager={onOpenSymbolManager}
              onChangeGeneralTolerance={editor.updateGeneralTolerance}
              onOpenToleranceModal={onOpenToleranceModal}
            />
          </>
        )}

        {activeTab === "preview" && (
          <ReportPreviewTab transferData={transferPayload} onRefresh={onRefreshPreview} />
        )}

        {activeTab === "json" && (
          <JsonPreviewTab
            transferData={transferPayload}
            onCopyJson={() => void handleCopyJson()}
            onDownloadJson={onDownloadJson}
          />
        )}
      </div>
    </section>
  );
}
