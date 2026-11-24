"use client";

import React from "react";
import type { GeneralToleranceRule } from "@/types/ppap";
import { formatToleranceString } from "@/utils/specFormatter";

interface ToleranceRulesTableProps {
  rules: GeneralToleranceRule[];
  onUpdateRule: (idx: number, patch: Partial<GeneralToleranceRule>) => void;
  onRemoveRule: (idx: number) => void;
}

export function ToleranceRulesTable({
  rules,
  onUpdateRule,
  onRemoveRule,
}: ToleranceRulesTableProps): React.ReactElement {
  return (
    <div className="overflow-hidden rounded-md border border-slate-200">
      <table className="w-full border-collapse text-center text-xs">
        <thead>
          <tr className="border-b border-slate-300 bg-slate-100 text-slate-700">
            <th className="py-1.5">起始尺寸 (mm)</th>
            <th className="py-1.5">結束尺寸 (留空=以上)</th>
            <th className="py-1.5">+ Tol</th>
            <th className="py-1.5">- Tol</th>
            <th className="w-12 py-1.5">刪除</th>
          </tr>
        </thead>
        <tbody>
          {rules.map((r, idx) => (
            <tr key={r.id} className="border-b border-slate-100">
              <td className="p-1.5">
                <input
                  type="number"
                  step="0.1"
                  value={r.minDim}
                  onChange={(e) => onUpdateRule(idx, { minDim: Number(e.target.value) || 0 })}
                  className="w-24 rounded border border-slate-300 px-2 py-1 text-center font-mono text-xs"
                />
              </td>
              <td className="p-1.5">
                <input
                  type="number"
                  step="0.1"
                  value={r.maxDim === null ? "" : r.maxDim}
                  placeholder="無上限"
                  onChange={(e) =>
                    onUpdateRule(idx, {
                      maxDim: e.target.value === "" ? null : Number(e.target.value),
                    })
                  }
                  className="w-24 rounded border border-slate-300 px-2 py-1 text-center font-mono text-xs"
                />
              </td>
              <td className="p-1.5">
                <input
                  type="text"
                  value={r.plus}
                  onChange={(e) => onUpdateRule(idx, { plus: e.target.value })}
                  onBlur={() => onUpdateRule(idx, { plus: formatToleranceString(r.plus, "+") })}
                  className="w-20 rounded border border-slate-300 px-2 py-1 text-center font-mono text-xs font-semibold text-teal-700"
                />
              </td>
              <td className="p-1.5">
                <input
                  type="text"
                  value={r.minus}
                  onChange={(e) => onUpdateRule(idx, { minus: e.target.value })}
                  onBlur={() => onUpdateRule(idx, { minus: formatToleranceString(r.minus, "-") })}
                  className="w-20 rounded border border-slate-300 px-2 py-1 text-center font-mono text-xs font-semibold text-red-700"
                />
              </td>
              <td className="p-1.5">
                <button
                  type="button"
                  disabled={rules.length <= 1}
                  onClick={() => onRemoveRule(idx)}
                  className="rounded px-1.5 py-0.5 text-red-600 hover:bg-red-50 disabled:opacity-30"
                >
                  ✕
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
