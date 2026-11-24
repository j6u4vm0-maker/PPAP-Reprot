"use client";

import React, { useState } from "react";
import type {
  BalloonStyle,
  GeneralToleranceConfig,
  GeneralToleranceProfile,
  SpecItem,
  SymbolItem,
} from "@/types/ppap";
import { applyQuickSymbol } from "@/utils/symbolHelper";
import { handleSpecTabKeyDown } from "@/utils/specTabNav";
import { DimensionSymbolPopover } from "./DimensionSymbolPopover";
import { GeneralToleranceBar } from "./GeneralToleranceBar";
import { SpecTableRow } from "./SpecTableRow";

interface SpecTableCardProps {
  specifications: SpecItem[];
  balloonStyle: BalloonStyle;
  generalTolerance: GeneralToleranceConfig;
  toleranceProfiles: GeneralToleranceProfile[];
  symbols: SymbolItem[];
  selectedRowIndex: number | null;
  targetItemIndex: number | null;
  onSelectRow: (index: number) => void;
  onLocateBalloon: (index: number) => void;
  onAddEmptyRow: () => void;
  onAddFormulaSpec: (formula: string) => boolean;
  onUpdateSpecField: (
    index: number,
    patch: Partial<SpecItem>,
    syncSymmetricMinus?: boolean
  ) => void;
  onMoveRow: (index: number, direction: -1 | 1) => void;
  onDeleteRow: (index: number) => void;
  onClearAllSpecs: () => void;
  onCopySpecsTsv: () => void;
  onOpenPasteModal: () => void;
  onOpenSymbolManager: () => void;
  onChangeGeneralTolerance: (next: GeneralToleranceConfig) => void;
  onOpenToleranceModal: () => void;
}

export function SpecTableCard({
  specifications,
  balloonStyle,
  generalTolerance,
  toleranceProfiles,
  symbols,
  selectedRowIndex,
  targetItemIndex,
  onSelectRow,
  onLocateBalloon,
  onAddEmptyRow,
  onAddFormulaSpec,
  onUpdateSpecField,
  onMoveRow,
  onDeleteRow,
  onClearAllSpecs,
  onCopySpecsTsv,
  onOpenPasteModal,
  onOpenSymbolManager,
  onChangeGeneralTolerance,
  onOpenToleranceModal,
}: SpecTableCardProps): React.ReactElement {
  const [quickInput, setQuickInput] = useState<string>("");
  const [symTolerance, setSymTolerance] = useState<boolean>(true);
  const [focusedDim, setFocusedDim] = useState<{
    index: number;
    inputEl: HTMLInputElement;
  } | null>(null);

  const placedCount = specifications.filter((s) => Boolean(s.balloonPosition)).length;

  const handleQuickSubmit = (): void => {
    const ok = onAddFormulaSpec(quickInput);
    if (ok) setQuickInput("");
  };

  const handleSelectQuickSymbol = (sym: SymbolItem): void => {
    if (!focusedDim) return;
    const spec = specifications[focusedDim.index];
    if (!spec) return;
    const { inputEl } = focusedDim;
    const { nextValue, nextCursor } = applyQuickSymbol(
      spec.dimension,
      sym,
      inputEl.selectionStart,
      inputEl.selectionEnd
    );
    onUpdateSpecField(focusedDim.index, { dimension: nextValue });
    requestAnimationFrame(() => {
      inputEl.focus();
      inputEl.setSelectionRange(nextCursor, nextCursor);
    });
  };

  return (
    <div className="flex min-h-[280px] flex-1 flex-col rounded-lg border border-slate-200 bg-white p-3.5 shadow-sm">
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-sm font-bold text-slate-900">2. P4 尺寸與公差規格表</h2>
          <span className="text-[11px] text-slate-500">
            項次與左側球標 01, 02... 自動雙向連動（支援新增／編輯／排序／刪除）
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={onOpenPasteModal}
            className="rounded-md border border-amber-300 bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-800 hover:bg-amber-100"
          >
            📋 一鍵貼上既有規格值
          </button>
          <button
            type="button"
            onClick={onAddEmptyRow}
            className="rounded-md border border-slate-300 bg-white px-2.5 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-100"
          >
            ＋ 新增項次
          </button>
        </div>
      </div>

      <div className="mb-2 flex flex-wrap items-center gap-2 rounded-md border border-slate-200 bg-slate-50 px-2.5 py-1.5">
        <input
          type="text"
          value={quickInput}
          onChange={(e) => setQuickInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              handleQuickSubmit();
            }
          }}
          placeholder="⚡ 快速輸入規格後按 Enter（例如：3.2±0.1、2.5 +0.15/-0.10、3.5 MIN、2.0 MAX）"
          className="min-w-[200px] flex-1 rounded border border-slate-300 bg-white px-2 py-1 text-xs focus:border-blue-600 focus:outline-none"
        />
        <button
          type="button"
          onClick={handleQuickSubmit}
          className="rounded bg-blue-600 px-2.5 py-1 text-xs font-semibold text-white hover:bg-blue-700"
        >
          加入
        </button>
        <label className="flex cursor-pointer select-none items-center gap-1 text-xs text-slate-600">
          <input
            type="checkbox"
            checked={symTolerance}
            onChange={(e) => setSymTolerance(e.target.checked)}
          />
          <span>對稱公差連動</span>
        </label>
      </div>

      <GeneralToleranceBar
        generalTolerance={generalTolerance}
        toleranceProfiles={toleranceProfiles}
        onChangeGeneralTolerance={onChangeGeneralTolerance}
        onOpenToleranceModal={onOpenToleranceModal}
      />

      <div className="flex-1 overflow-auto rounded-md border border-slate-200">
        <table className="w-full border-collapse text-center text-xs">
          <thead>
            <tr className="sticky top-0 z-10 border-b border-slate-300 bg-slate-100 text-slate-700">
              <th className="w-12 py-1.5 font-bold">球標</th>
              <th className="w-20 py-1.5 font-bold">Dimension</th>
              <th className="w-20 py-1.5 font-bold">+ Tol</th>
              <th className="w-20 py-1.5 font-bold">- Tol</th>
              <th className="w-28 py-1.5 font-bold">允收範圍</th>
              <th className="w-12 py-1.5 font-bold">Cavity</th>
              <th className="w-14 py-1.5 font-bold">Qty</th>
              <th className="w-20 py-1.5 font-bold">操作</th>
            </tr>
          </thead>
          <tbody>
            {specifications.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-6 text-slate-400">
                  尚無尺寸規格。請點擊左側圖面標記球標、使用「一鍵貼上」或按「＋ 新增項次」。
                </td>
              </tr>
            ) : (
              specifications.map((spec, idx) => (
                <SpecTableRow
                  key={`${spec.item}_${idx}`}
                  spec={spec}
                  index={idx}
                  totalRows={specifications.length}
                  balloonStyle={balloonStyle}
                  generalTolerance={generalTolerance}
                  isSelected={selectedRowIndex === idx}
                  isTargeting={targetItemIndex === idx}
                  symTolerance={symTolerance}
                  onSelect={() => onSelectRow(idx)}
                  onLocateBalloon={() => onLocateBalloon(idx)}
                  onUpdate={(patch, sync) => onUpdateSpecField(idx, patch, sync)}
                  onMove={(dir) => onMoveRow(idx, dir)}
                  onDelete={() => onDeleteRow(idx)}
                  onCellTab={(col, e) => handleSpecTabKeyDown(e, specifications, idx, col, onSelectRow)}
                  onDimensionFocus={(el) => setFocusedDim({ index: idx, inputEl: el })}
                  onDimensionBlur={() =>
                    setFocusedDim((prev) => (prev && prev.index === idx ? null : prev))
                  }
                />
              ))
            )}
          </tbody>
        </table>
      </div>

      <DimensionSymbolPopover
        anchorEl={focusedDim?.inputEl ?? null}
        symbols={symbols}
        onSelectSymbol={handleSelectQuickSymbol}
        onOpenManager={() => {
          setFocusedDim(null);
          onOpenSymbolManager();
        }}
      />

      <div className="mt-2 flex items-center justify-between text-xs text-slate-500">
        <span>
          共 {specifications.length} 項尺寸規格，{placedCount} 個球標已標記於圖面
        </span>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={onCopySpecsTsv}
            className="rounded px-2 py-0.5 text-slate-600 hover:bg-slate-100"
          >
            📄 複製規格表
          </button>
          <button
            type="button"
            onClick={onClearAllSpecs}
            className="rounded px-2 py-0.5 text-red-600 hover:bg-red-50"
          >
            🗑️ 清空規格
          </button>
        </div>
      </div>
    </div>
  );
}
