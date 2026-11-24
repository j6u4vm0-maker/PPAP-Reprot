"use client";

import React from "react";
import type { GeneralToleranceConfig, GeneralToleranceProfile } from "@/types/ppap";
import { formatGeneralToleranceSummary } from "@/utils/generalTolerance";

interface GeneralToleranceBarProps {
  generalTolerance: GeneralToleranceConfig;
  toleranceProfiles: GeneralToleranceProfile[];
  onChangeGeneralTolerance: (next: GeneralToleranceConfig) => void;
  onOpenToleranceModal: () => void;
}

export function GeneralToleranceBar({
  generalTolerance,
  toleranceProfiles,
  onChangeGeneralTolerance,
  onOpenToleranceModal,
}: GeneralToleranceBarProps): React.ReactElement {
  return (
    <div className="mb-2 flex flex-wrap items-center justify-between gap-2 rounded-md border border-blue-200/80 bg-blue-50/50 px-2.5 py-1.5 text-xs">
      <div className="flex flex-wrap items-center gap-2">
        <span className="font-bold text-slate-700">一般公差（未填公差自動套用）：</span>
        <span className="rounded bg-white px-2 py-0.5 font-mono text-[11px] font-semibold text-blue-800 shadow-sm">
          {formatGeneralToleranceSummary(generalTolerance)}
        </span>
      </div>
      <div className="flex items-center gap-1.5">
        <select
          value=""
          onChange={(e) => {
            const found = toleranceProfiles.find((p) => p.id === e.target.value);
            if (found) {
              onChangeGeneralTolerance({
                enabled: true,
                profileName: found.name,
                rules: found.rules.map((r) => ({ ...r })),
              });
            }
          }}
          className="rounded border border-slate-300 bg-white px-2 py-0.5 text-[11px] text-slate-700"
        >
          <option value="">快選範本...</option>
          {toleranceProfiles.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
        <button
          type="button"
          onClick={onOpenToleranceModal}
          className="rounded border border-blue-300 bg-white px-2 py-0.5 text-[11px] font-semibold text-blue-700 hover:bg-blue-50"
        >
          ⚙️ 設定／管理
        </button>
      </div>
    </div>
  );
}
