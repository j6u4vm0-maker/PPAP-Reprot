"use client";

import React from "react";
import type { BalloonStyle, GeneralToleranceConfig, SpecItem } from "@/types/ppap";
import type { SpecTabColumn } from "@/utils/specTabNav";
import { resolveEffectiveSpec } from "@/utils/generalTolerance";
import {
  formatBalloonLabel,
  formatDimensionWithSymbols,
  formatLimitDisplay,
  formatToleranceString,
} from "@/utils/specFormatter";

interface SpecTableRowProps {
  spec: SpecItem;
  index: number;
  totalRows: number;
  balloonStyle: BalloonStyle;
  generalTolerance: GeneralToleranceConfig;
  isSelected: boolean;
  isTargeting: boolean;
  symTolerance: boolean;
  onSelect: () => void;
  onLocateBalloon: () => void;
  onUpdate: (patch: Partial<SpecItem>, syncSym?: boolean) => void;
  onMove: (direction: -1 | 1) => void;
  onDelete: () => void;
  onCellTab: (col: SpecTabColumn, e: React.KeyboardEvent<HTMLInputElement>) => void;
  onDimensionFocus: (inputEl: HTMLInputElement) => void;
  onDimensionBlur: () => void;
}

export function SpecTableRow({
  spec,
  index,
  totalRows,
  balloonStyle,
  generalTolerance,
  isSelected,
  isTargeting,
  symTolerance,
  onSelect,
  onLocateBalloon,
  onUpdate,
  onMove,
  onDelete,
  onCellTab,
  onDimensionFocus,
  onDimensionBlur,
}: SpecTableRowProps): React.ReactElement {
  const placed = Boolean(spec.balloonPosition);
  const resolved = resolveEffectiveSpec(spec, generalTolerance);
  const limitText = formatLimitDisplay(resolved);
  const isNoToleranceSpec = resolved.isReference || resolved.unilateralType !== null;

  return (
    <tr
      onClick={onSelect}
      onFocusCapture={onSelect}
      className={`border-b border-slate-100 hover:bg-slate-50 ${
        isSelected ? "bg-blue-50/70" : ""
      }`}
    >
      <td className="p-1">
        <button
          type="button"
          tabIndex={-1}
          onClick={(e) => {
            e.stopPropagation();
            onLocateBalloon();
          }}
          title={placed ? "已定位於圖面（點擊可重設位置）" : "尚未定位（點擊後再點圖面）"}
          className={`inline-flex h-7 w-7 items-center justify-center rounded-full text-xs font-extrabold transition ${
            isTargeting
              ? "animate-pulse border-2 border-amber-800 bg-amber-500 text-white"
              : placed
              ? "bg-slate-900 text-white"
              : "border-2 border-dashed border-slate-400 bg-white text-slate-600"
          }`}
        >
          {formatBalloonLabel(spec.item, balloonStyle.padZero)}
        </button>
      </td>

      <td className="p-1">
        <input
          type="text"
          data-spec-row={index}
          data-spec-col="dimension"
          value={spec.dimension}
          onFocus={(e) => onDimensionFocus(e.currentTarget)}
          onKeyDown={(e) => onCellTab("dimension", e)}
          onChange={(e) => onUpdate({ dimension: e.target.value })}
          onBlur={() => {
            if (spec.dimension.trim()) {
              onUpdate({ dimension: formatDimensionWithSymbols(spec.dimension, 2) });
            }
            onDimensionBlur();
          }}
          placeholder="3.20"
          className="w-full rounded border border-slate-300 px-1 py-1 text-center font-mono text-xs focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
        />
      </td>

      <td className="p-1">
        <input
          type="text"
          data-spec-row={index}
          data-spec-col="tolerancePlus"
          value={spec.tolerancePlus}
          onKeyDown={(e) => onCellTab("tolerancePlus", e)}
          onChange={(e) => onUpdate({ tolerancePlus: e.target.value }, symTolerance)}
          onBlur={() => {
            if (spec.tolerancePlus.trim()) {
              onUpdate(
                { tolerancePlus: formatToleranceString(spec.tolerancePlus, "+") },
                symTolerance
              );
            }
          }}
          placeholder={
            isNoToleranceSpec ? "—" : resolved.isGeneralTolerance ? resolved.tolerancePlus : "+0.10"
          }
          className="w-full rounded border border-slate-300 px-1 py-1 text-center font-mono text-xs font-semibold text-teal-700 placeholder:font-normal placeholder:text-slate-400"
        />
      </td>

      <td className="p-1">
        <input
          type="text"
          data-spec-row={index}
          data-spec-col="toleranceMinus"
          value={spec.toleranceMinus}
          onKeyDown={(e) => onCellTab("toleranceMinus", e)}
          onChange={(e) => onUpdate({ toleranceMinus: e.target.value })}
          onBlur={() => {
            if (spec.toleranceMinus.trim()) {
              onUpdate({ toleranceMinus: formatToleranceString(spec.toleranceMinus, "-") });
            }
          }}
          placeholder={
            isNoToleranceSpec ? "—" : resolved.isGeneralTolerance ? resolved.toleranceMinus : "-0.10"
          }
          className="w-full rounded border border-slate-300 px-1 py-1 text-center font-mono text-xs font-semibold text-red-700 placeholder:font-normal placeholder:text-slate-400"
        />
      </td>

      <td
        className={`p-1 font-mono text-[11px] ${
          resolved.isReference
            ? "font-semibold text-blue-700"
            : resolved.unilateralType !== null
            ? "font-semibold text-indigo-700"
            : spec.dimension && !resolved.valid
            ? "font-bold text-red-600"
            : "text-slate-600"
        }`}
      >
        {resolved.isReference ? (
          <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[10.5px] font-bold text-blue-700">
            參考
          </span>
        ) : resolved.unilateralType !== null ? (
          <span className="rounded-full bg-indigo-50 px-2 py-0.5 text-[10.5px] font-bold text-indigo-700">
            {limitText}
          </span>
        ) : (
          <div className="flex items-center justify-center gap-1">
            <span>{limitText}</span>
            {resolved.isGeneralTolerance && (
              <span
                title="此項未填寫公差，自動套用一般公差"
                className="rounded bg-slate-200 px-1 font-sans text-[9.5px] font-bold text-slate-600"
              >
                一般
              </span>
            )}
          </div>
        )}
      </td>

      <td className="p-1">
        <input
          type="text"
          tabIndex={-1}
          value={spec.cavity}
          onChange={(e) => onUpdate({ cavity: e.target.value })}
          className="w-full rounded border border-slate-300 px-1 py-1 text-center font-mono text-xs"
        />
      </td>

      <td className="p-1">
        <input
          type="number"
          tabIndex={-1}
          min={1}
          value={spec.testQuantity}
          onChange={(e) =>
            onUpdate({ testQuantity: Math.max(1, Number(e.target.value) || 1) })
          }
          className="w-full rounded border border-slate-300 px-1 py-1 text-center font-mono text-xs"
        />
      </td>

      <td className="p-1">
        <div className="inline-flex items-center gap-0.5">
          <button
            type="button"
            tabIndex={-1}
            onClick={(e) => {
              e.stopPropagation();
              onMove(-1);
            }}
            disabled={index === 0}
            className="rounded px-1 py-0.5 text-slate-600 hover:bg-slate-200 disabled:opacity-30"
            title="上移"
          >
            ↑
          </button>
          <button
            type="button"
            tabIndex={-1}
            onClick={(e) => {
              e.stopPropagation();
              onMove(1);
            }}
            disabled={index === totalRows - 1}
            className="rounded px-1 py-0.5 text-slate-600 hover:bg-slate-200 disabled:opacity-30"
            title="下移"
          >
            ↓
          </button>
          <button
            type="button"
            tabIndex={-1}
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            className="rounded px-1 py-0.5 text-red-600 hover:bg-red-50"
            title="刪除此項"
          >
            ✕
          </button>
        </div>
      </td>
    </tr>
  );
}
