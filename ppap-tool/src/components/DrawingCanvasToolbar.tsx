"use client";

import React, { useRef } from "react";
import type { BalloonStyle, CanvasMode } from "@/types/ppap";
import { BalloonStyleBar } from "./BalloonStyleBar";

interface DrawingCanvasToolbarProps {
  hasMedia: boolean;
  sourceFileName: string;
  pdfPage: number;
  pdfNumPages: number;
  rotation: number;
  zoom: number;
  mode: CanvasMode;
  hasCrop: boolean;
  placedBalloonCount: number;
  selectedBalloonLabel: string | null;
  balloonStyle: BalloonStyle;
  onUploadFile: (file: File) => void;
  onPasteScreenshot: () => void;
  onRemoveMedia: () => void;
  onPrevPage: () => void;
  onNextPage: () => void;
  onZoomOut: () => void;
  onZoomIn: () => void;
  onZoomFit: () => void;
  onRotate: () => void;
  onModeChange: (mode: CanvasMode) => void;
  onClearCrop: () => void;
  onDeleteSelectedBalloon: () => void;
  onClearAllBalloons: () => void;
  onBalloonStyleChange: (next: Partial<BalloonStyle>) => void;
  onDownloadPng: () => void;
}

export function DrawingCanvasToolbar({
  hasMedia,
  sourceFileName,
  pdfPage,
  pdfNumPages,
  rotation,
  zoom,
  mode,
  hasCrop,
  placedBalloonCount,
  selectedBalloonLabel,
  balloonStyle,
  onUploadFile,
  onPasteScreenshot,
  onRemoveMedia,
  onPrevPage,
  onNextPage,
  onZoomOut,
  onZoomIn,
  onZoomFit,
  onRotate,
  onModeChange,
  onClearCrop,
  onDeleteSelectedBalloon,
  onClearAllBalloons,
  onBalloonStyleChange,
  onDownloadPng,
}: DrawingCanvasToolbarProps): React.ReactElement {
  const fileInputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="shrink-0">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 bg-white px-3 py-2">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="rounded-md bg-blue-600 px-2.5 py-1 text-xs font-semibold text-white transition hover:bg-blue-700"
          >
            📄 {hasMedia ? "替換 PDF / 圖檔" : "匯入 PDF / 圖檔"}
          </button>
          <button
            type="button"
            onClick={onPasteScreenshot}
            title="從剪貼簿貼上截圖（也可直接按 Ctrl+V）"
            className="rounded-md border border-indigo-300 bg-indigo-50 px-2.5 py-1 text-xs font-semibold text-indigo-700 transition hover:bg-indigo-100"
          >
            📋 貼上截圖
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,image/png,image/jpeg,image/webp"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) onUploadFile(file);
              e.target.value = "";
            }}
            className="hidden"
          />
          {hasMedia && (
            <button
              type="button"
              onClick={onRemoveMedia}
              className="rounded-md border border-red-200 bg-red-50 px-2 py-1 text-xs font-semibold text-red-700 transition hover:bg-red-100"
            >
              🗑️ 移除圖紙
            </button>
          )}
          <span className="max-w-[160px] truncate text-xs text-slate-500">
            {sourceFileName || "尚未載入圖紙"}
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          {pdfNumPages > 1 && (
            <div className="mr-2 flex items-center gap-1">
              <button
                type="button"
                onClick={onPrevPage}
                disabled={pdfPage <= 1}
                className="rounded border border-slate-300 bg-white px-1.5 py-0.5 text-xs hover:bg-slate-100 disabled:opacity-40"
              >
                ◀
              </button>
              <span className="min-w-[44px] text-center text-xs font-semibold">
                {pdfPage} / {pdfNumPages}
              </span>
              <button
                type="button"
                onClick={onNextPage}
                disabled={pdfPage >= pdfNumPages}
                className="rounded border border-slate-300 bg-white px-1.5 py-0.5 text-xs hover:bg-slate-100 disabled:opacity-40"
              >
                ▶
              </button>
            </div>
          )}

          <button
            type="button"
            onClick={onZoomOut}
            className="rounded border border-slate-300 bg-white px-2 py-0.5 text-xs font-semibold hover:bg-slate-100"
          >
            －
          </button>
          <span className="min-w-[42px] text-center text-xs font-semibold tabular-nums">
            {Math.round(zoom * 100)}%
          </span>
          <button
            type="button"
            onClick={onZoomIn}
            className="rounded border border-slate-300 bg-white px-2 py-0.5 text-xs font-semibold hover:bg-slate-100"
          >
            ＋
          </button>
          <button
            type="button"
            onClick={onZoomFit}
            className="rounded border border-slate-300 bg-white px-2 py-0.5 text-xs font-semibold hover:bg-slate-100"
          >
            適應
          </button>
          <button
            type="button"
            onClick={onRotate}
            className={`rounded border px-2 py-0.5 text-xs font-semibold ${
              rotation !== 0
                ? "border-blue-400 bg-blue-50 text-blue-700 hover:bg-blue-100"
                : "border-slate-300 bg-white hover:bg-slate-100"
            }`}
            title="順時針旋轉 90°（球標與裁切範圍同步旋轉並儲存方向）"
          >
            ↻{rotation !== 0 ? ` ${rotation}°` : ""}
          </button>
        </div>
      </div>

      <BalloonStyleBar
        mode={mode}
        hasCrop={hasCrop}
        placedBalloonCount={placedBalloonCount}
        selectedBalloonLabel={selectedBalloonLabel}
        balloonStyle={balloonStyle}
        onModeChange={onModeChange}
        onClearCrop={onClearCrop}
        onDeleteSelectedBalloon={onDeleteSelectedBalloon}
        onClearAllBalloons={onClearAllBalloons}
        onBalloonStyleChange={onBalloonStyleChange}
        onDownloadPng={onDownloadPng}
      />
    </div>
  );
}
