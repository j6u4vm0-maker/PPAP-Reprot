"use client";

import React, { useEffect, useRef, useState } from "react";
import type { BalloonPosition, BalloonStyle, CanvasMode, CropRect, SpecItem } from "@/types/ppap";
import { formatBalloonLabel } from "@/utils/specFormatter";
import { BalloonOverlayLayer } from "./BalloonOverlayLayer";

interface DrawingCanvasStageProps {
  hasMedia: boolean;
  mode: CanvasMode;
  zoom: number;
  specifications: SpecItem[];
  balloonStyle: BalloonStyle;
  cropRect: CropRect | null;
  selectedRowIndex: number | null;
  targetItemIndex: number | null;
  displayCanvasRef: React.RefObject<HTMLCanvasElement>;
  viewportRef: React.RefObject<HTMLDivElement>;
  onUploadFile: (file: File) => void;
  onPasteScreenshot: () => void;
  onOpenDb: () => void;
  onCanvasPlaceBalloon: (pos: BalloonPosition) => void;
  onMoveBalloon: (index: number, pos: BalloonPosition) => void;
  onRemoveBalloonPosition: (index: number) => void;
  onDeleteBalloonAndSpec: (index: number) => void;
  onSelectRow: (index: number) => void;
  onCropChange: (rect: CropRect | null) => void;
}

export function DrawingCanvasStage({
  hasMedia,
  mode,
  zoom,
  specifications,
  balloonStyle,
  cropRect,
  selectedRowIndex,
  targetItemIndex,
  displayCanvasRef,
  viewportRef,
  onUploadFile,
  onPasteScreenshot,
  onOpenDb,
  onCanvasPlaceBalloon,
  onMoveBalloon,
  onRemoveBalloonPosition,
  onDeleteBalloonAndSpec,
  onSelectRow,
  onCropChange,
}: DrawingCanvasStageProps): React.ReactElement {
  const [isDragOver, setIsDragOver] = useState<boolean>(false);
  const dropInputRef = useRef<HTMLInputElement>(null);
  const specsRef = useRef<SpecItem[]>(specifications);
  specsRef.current = specifications;

  // 切換或聚焦右側項次時，平滑捲動左側圖紙使該球標置中顯示
  useEffect(() => {
    if (!hasMedia || selectedRowIndex === null) return;
    const spec = specsRef.current[selectedRowIndex];
    const vp = viewportRef.current;
    const canvasEl = displayCanvasRef.current;
    if (!spec?.balloonPosition || !vp || !canvasEl) return;

    const targetX = canvasEl.offsetLeft + (spec.balloonPosition.xPercent / 100) * canvasEl.clientWidth;
    const targetY = canvasEl.offsetTop + (spec.balloonPosition.yPercent / 100) * canvasEl.clientHeight;
    vp.scrollTo({
      left: Math.max(0, targetX - vp.clientWidth / 2),
      top: Math.max(0, targetY - vp.clientHeight / 2),
      behavior: "smooth",
    });
  }, [displayCanvasRef, hasMedia, selectedRowIndex, viewportRef]);

  const handleDrop = (e: React.DragEvent<HTMLDivElement>): void => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) onUploadFile(file);
  };

  const handleCropMouseDown = (e: React.MouseEvent<HTMLDivElement>): void => {
    if (mode !== "crop" || !hasMedia) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const startX = Math.max(0, Math.min(rect.width, e.clientX - rect.left));
    const startY = Math.max(0, Math.min(rect.height, e.clientY - rect.top));

    let latest: CropRect | null = null;
    const onMouseMove = (ev: MouseEvent): void => {
      const curX = Math.max(0, Math.min(rect.width, ev.clientX - rect.left));
      const curY = Math.max(0, Math.min(rect.height, ev.clientY - rect.top));
      latest = {
        xPercent: Number(((Math.min(startX, curX) / rect.width) * 100).toFixed(2)),
        yPercent: Number(((Math.min(startY, curY) / rect.height) * 100).toFixed(2)),
        wPercent: Number(((Math.abs(curX - startX) / rect.width) * 100).toFixed(2)),
        hPercent: Number(((Math.abs(curY - startY) / rect.height) * 100).toFixed(2)),
      };
      onCropChange(latest);
    };

    const onMouseUp = (): void => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
      if (!latest || latest.wPercent < 2 || latest.hPercent < 2) onCropChange(null);
    };

    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
  };

  const nextUnplaced = specifications.find((s) => !s.balloonPosition);
  const targetSpec = targetItemIndex !== null ? specifications[targetItemIndex] : null;
  const hasCrop = Boolean(cropRect && cropRect.wPercent > 1 && cropRect.hPercent > 1);

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <div
        className={`border-b px-3 py-1.5 text-xs ${
          targetSpec
            ? "border-amber-400 bg-amber-100 font-semibold text-amber-900"
            : "border-blue-200 bg-blue-50 text-blue-900"
        }`}
      >
        {targetSpec ? (
          <span>
            🎯 指定定位模式：請點擊圖面放置球標{" "}
            <b>[{formatBalloonLabel(targetSpec.item, balloonStyle.padZero)}]</b>（按 Esc 取消）
          </span>
        ) : mode === "crop" ? (
          <span>✂️ 裁切模式：拖曳框選要輸出至 P3 報告的工程圖區域。</span>
        ) : nextUnplaced && hasMedia ? (
          <span>
            💡 點擊圖面將自動放置尚未定位的球標{" "}
            <b>[{formatBalloonLabel(nextUnplaced.item, balloonStyle.padZero)}]</b>（尺寸{" "}
            {nextUnplaced.dimension || "—"}）；左鍵拖曳微調，右鍵刪除位置。
          </span>
        ) : (
          <span>
            💡 匯入 PDF 後直接點擊尺寸旁放置 <b>01, 02...</b> 球標；左鍵拖曳微調，右鍵移除位置。
          </span>
        )}
      </div>

      <div
        ref={viewportRef}
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragOver(true);
        }}
        onDragLeave={() => setIsDragOver(false)}
        onDrop={handleDrop}
        className={`relative flex flex-1 items-start justify-center overflow-auto p-5 transition ${
          isDragOver
            ? "bg-blue-100 outline-dashed outline-2 -outline-offset-8 outline-blue-600"
            : "bg-slate-200/80"
        }`}
      >
        {!hasMedia && (
          <div className="m-auto w-full max-w-md rounded-xl border-2 border-dashed border-slate-300 bg-white p-8 text-center shadow-sm">
            <div className="mb-2 text-4xl">📐</div>
            <h3 className="mb-1 text-base font-bold text-slate-900">
              拖曳工程圖 PDF / 圖片，或按 Ctrl+V 貼上截圖
            </h3>
            <p className="mb-4 text-xs leading-relaxed text-slate-500">
              支援多頁 PDF 離線渲染、Win+Shift+S 截圖直接貼上、框選裁切 P3 圖面與放置球標
            </p>
            <div className="flex flex-wrap justify-center gap-2">
              <button
                type="button"
                onClick={() => dropInputRef.current?.click()}
                className="rounded-md bg-blue-600 px-3.5 py-2 text-xs font-semibold text-white hover:bg-blue-700"
              >
                選擇 PDF / 圖檔
              </button>
              <button
                type="button"
                onClick={onPasteScreenshot}
                className="rounded-md border border-indigo-300 bg-indigo-50 px-3.5 py-2 text-xs font-semibold text-indigo-700 hover:bg-indigo-100"
              >
                📋 貼上截圖 (Ctrl+V)
              </button>
              <input
                ref={dropInputRef}
                type="file"
                accept=".pdf,image/png,image/jpeg,image/webp"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) onUploadFile(file);
                  e.target.value = "";
                }}
                className="hidden"
              />
              <button
                type="button"
                onClick={onOpenDb}
                className="rounded-md border border-slate-300 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100"
              >
                從圖紙資料庫呼叫範例
              </button>
            </div>
          </div>
        )}

        <div
          className={`relative inline-block select-none bg-white leading-none shadow-xl ${
            hasMedia ? "" : "hidden"
          }`}
        >
          <canvas ref={displayCanvasRef} className="block" />

          {(mode === "crop" || hasCrop) && (
            <div
              onMouseDown={handleCropMouseDown}
              className={`absolute inset-0 ${
                mode === "crop"
                  ? "z-30 cursor-crosshair bg-slate-900/20"
                  : "pointer-events-none z-10"
              }`}
            >
              {hasCrop && cropRect && (
                <div
                  style={{
                    left: `${cropRect.xPercent}%`,
                    top: `${cropRect.yPercent}%`,
                    width: `${cropRect.wPercent}%`,
                    height: `${cropRect.hPercent}%`,
                  }}
                  className="absolute border-2 border-dashed border-blue-600 bg-blue-500/10"
                >
                  <span className="absolute -top-5 left-0 rounded-t bg-blue-600 px-1.5 py-0.5 text-[10px] font-semibold text-white">
                    P3 輸出範圍
                  </span>
                </div>
              )}
            </div>
          )}

          <BalloonOverlayLayer
            hasMedia={hasMedia}
            mode={mode}
            zoom={zoom}
            specifications={specifications}
            balloonStyle={balloonStyle}
            selectedRowIndex={selectedRowIndex}
            onPlaceBalloon={onCanvasPlaceBalloon}
            onMoveBalloon={onMoveBalloon}
            onRemoveBalloonPosition={onRemoveBalloonPosition}
            onDeleteBalloonAndSpec={onDeleteBalloonAndSpec}
            onSelectRow={onSelectRow}
          />
        </div>
      </div>
    </div>
  );
}
