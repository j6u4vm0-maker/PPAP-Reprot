"use client";

import React from "react";
import type { TransferJsonPayload } from "@/types/ppap";
import { ReportP3Sheet } from "./ReportP3Sheet";
import { ReportP4Sheet } from "./ReportP4Sheet";

interface ReportPreviewTabProps {
  transferData: TransferJsonPayload;
  onRefresh: () => void;
  onExportWord: () => void;
}

export function ReportPreviewTab({
  transferData,
  onRefresh,
  onExportWord,
}: ReportPreviewTabProps): React.ReactElement {
  return (
    <div className="flex flex-col gap-4 pb-4">
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-600">
        <span>
          標準 <b>A4 直式（Portrait）</b> 報告預覽 — 留白公差已自動套用一般公差數值：
        </span>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={onRefresh}
            className="rounded border border-slate-300 bg-white px-2.5 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-100"
          >
            🔄 更新預覽
          </button>
          <button
            type="button"
            onClick={onExportWord}
            className="rounded bg-indigo-600 px-2.5 py-1 text-xs font-semibold text-white hover:bg-indigo-700"
          >
            📄 匯出 Word (.docx)
          </button>
        </div>
      </div>

      <ReportP3Sheet page3={transferData.page3} />
      <ReportP4Sheet page4={transferData.page4} />
    </div>
  );
}
