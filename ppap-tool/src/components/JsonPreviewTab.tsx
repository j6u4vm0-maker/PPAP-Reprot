"use client";

import React from "react";
import type { TransferJsonPayload } from "@/types/ppap";

interface JsonPreviewTabProps {
  transferData: TransferJsonPayload;
  onCopyJson: () => void;
  onDownloadJson: () => void;
}

export function JsonPreviewTab({
  transferData,
  onCopyJson,
  onDownloadJson,
}: JsonPreviewTabProps): React.ReactElement {
  const displayObj: TransferJsonPayload = {
    ...transferData,
    page3: {
      ...transferData.page3,
      balloonedDrawingImageBase64: transferData.page3.balloonedDrawingImageBase64
        ? `${transferData.page3.balloonedDrawingImageBase64.slice(0, 72)}... (完整圖片共 ${Math.round(
            transferData.page3.balloonedDrawingImageBase64.length / 1024
          )} KB，下載 JSON 檔案時將完整寫入)`
        : null,
    },
  };

  return (
    <div className="flex flex-1 flex-col gap-3 overflow-hidden">
      <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-600">
        <span>以下為匯出給下一個實驗室量測系統進行移轉的標準 JSON 結構：</span>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={onCopyJson}
            className="rounded border border-slate-300 bg-white px-2.5 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-100"
          >
            📋 複製 JSON
          </button>
          <button
            type="button"
            onClick={onDownloadJson}
            className="rounded bg-teal-600 px-2.5 py-1 text-xs font-semibold text-white hover:bg-teal-700"
          >
            🚀 下載 JSON 檔案
          </button>
        </div>
      </div>

      <pre className="flex-1 overflow-auto whitespace-pre-wrap break-all rounded-lg bg-slate-900 p-4 font-mono text-xs leading-relaxed text-slate-200">
        {JSON.stringify(displayObj, null, 2)}
      </pre>
    </div>
  );
}
