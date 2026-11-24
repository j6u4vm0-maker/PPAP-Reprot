"use client";

import React from "react";
import type { PartMasterItem } from "@/types/ppap";

interface PartMasterPickerBarProps {
  parts: PartMasterItem[];
  linkedPartIds: Set<string>;
  canSaveCurrent: boolean;
  onSelectPart: (item: PartMasterItem) => void;
  onSaveCurrentToMaster: () => void;
  onOpenManager: () => void;
}

/**
 * 置於表頭上方的「料號／品名／圖號／版次」主檔快選與管理條（連動載入對應圖紙）
 */
export function PartMasterPickerBar({
  parts,
  linkedPartIds,
  canSaveCurrent,
  onSelectPart,
  onSaveCurrentToMaster,
  onOpenManager,
}: PartMasterPickerBarProps): React.ReactElement {
  return (
    <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-indigo-200/80 bg-indigo-50/60 px-3 py-2 text-xs shadow-sm">
      <div className="flex min-w-[220px] flex-1 items-center gap-2">
        <span className="whitespace-nowrap font-bold text-indigo-900">
          🗂️ 料號／圖號主檔：
        </span>
        <select
          value=""
          onChange={(e) => {
            const found = parts.find((p) => p.id === e.target.value);
            if (found) onSelectPart(found);
          }}
          className="min-w-[180px] max-w-md flex-1 rounded border border-indigo-300 bg-white px-2 py-1 text-xs text-slate-800 focus:border-indigo-600 focus:outline-none"
        >
          <option value="">
            {parts.length > 0
              ? `快選切換主檔與圖紙（共 ${parts.length} 筆，📎 表示已有圖紙）...`
              : "尚無主檔，請先點擊右側管理建立..."}
          </option>
          {parts.map((p) => {
            const hasDrawing = linkedPartIds.has(p.id);
            return (
              <option key={p.id} value={p.id}>
                {hasDrawing ? "📎 " : "📄 "}
                {[
                  p.partNo || "(無料號)",
                  p.testStandard ? `${p.testStandard}${p.revision ? ` / ${p.revision}` : ""}` : "",
                  p.partName,
                ]
                  .filter(Boolean)
                  .join(" ｜ ")}
              </option>
            );
          })}
        </select>
      </div>

      <div className="flex items-center gap-1.5">
        <button
          type="button"
          disabled={!canSaveCurrent}
          onClick={onSaveCurrentToMaster}
          title="將目前填寫的料號、品名、圖號、版次、發行日期存進主檔"
          className="rounded border border-emerald-300 bg-white px-2.5 py-1 text-[11px] font-semibold text-emerald-700 hover:bg-emerald-50 disabled:opacity-40"
        >
          ＋ 存成主檔
        </button>
        <button
          type="button"
          onClick={onOpenManager}
          className="rounded border border-indigo-300 bg-white px-2.5 py-1 text-[11px] font-semibold text-indigo-700 hover:bg-indigo-100"
        >
          ⚙️ 管理主檔
        </button>
      </div>
    </div>
  );
}
