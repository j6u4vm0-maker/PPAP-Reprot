"use client";

import React, { useRef, useState } from "react";
import type { BalloonPosition, BalloonStyle, CanvasMode, SpecItem } from "@/types/ppap";
import { formatBalloonLabel } from "@/utils/specFormatter";

interface BalloonOverlayLayerProps {
  hasMedia: boolean;
  mode: CanvasMode;
  zoom: number;
  specifications: SpecItem[];
  balloonStyle: BalloonStyle;
  selectedRowIndex: number | null;
  onPlaceBalloon: (pos: BalloonPosition) => void;
  onMoveBalloon: (index: number, pos: BalloonPosition) => void;
  onRemoveBalloonPosition: (index: number) => void;
  onDeleteBalloonAndSpec: (index: number) => void;
  onSelectRow: (index: number) => void;
}

export function BalloonOverlayLayer({
  hasMedia,
  mode,
  zoom,
  specifications,
  balloonStyle,
  selectedRowIndex,
  onPlaceBalloon,
  onMoveBalloon,
  onRemoveBalloonPosition,
  onDeleteBalloonAndSpec,
  onSelectRow,
}: BalloonOverlayLayerProps): React.ReactElement {
  const [draggingIdx, setDraggingIdx] = useState<number | null>(null);
  const layerRef = useRef<HTMLDivElement>(null);

  const displayRadius = Math.max(9, Math.round(balloonStyle.radius * Math.max(0.65, zoom * 1.1)));
  const diameter = displayRadius * 2;
  const fontSize = Math.max(10, Math.round(displayRadius * 0.95));

  const handleLayerClick = (e: React.MouseEvent<HTMLDivElement>): void => {
    if (!hasMedia || mode !== "balloon") return;
    if ((e.target as HTMLElement).closest("[data-balloon-marker]")) return;
    const rect = layerRef.current?.getBoundingClientRect();
    if (!rect || rect.width === 0 || rect.height === 0) return;

    onPlaceBalloon({
      xPercent: Number((((e.clientX - rect.left) / rect.width) * 100).toFixed(2)),
      yPercent: Number((((e.clientY - rect.top) / rect.height) * 100).toFixed(2)),
    });
  };

  const handleMarkerMouseDown = (
    e: React.MouseEvent<HTMLDivElement>,
    idx: number
  ): void => {
    if (e.button !== 0 || mode !== "balloon") return;
    e.stopPropagation();
    onSelectRow(idx);
    const rect = layerRef.current?.getBoundingClientRect();
    if (!rect) return;
    setDraggingIdx(idx);

    const onMouseMove = (ev: MouseEvent): void => {
      const x = Math.max(0, Math.min(rect.width, ev.clientX - rect.left));
      const y = Math.max(0, Math.min(rect.height, ev.clientY - rect.top));
      onMoveBalloon(idx, {
        xPercent: Number(((x / rect.width) * 100).toFixed(2)),
        yPercent: Number(((y / rect.height) * 100).toFixed(2)),
      });
    };

    const onMouseUp = (): void => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
      setDraggingIdx(null);
    };

    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
  };

  return (
    <div
      ref={layerRef}
      onClick={handleLayerClick}
      className={`absolute inset-0 z-20 ${
        mode === "crop" ? "pointer-events-none" : "cursor-crosshair"
      }`}
    >
      {specifications.map((spec, idx) => {
        if (!spec.balloonPosition) return null;
        const isSelected = selectedRowIndex === idx;
        const isDragging = draggingIdx === idx;
        const label = formatBalloonLabel(spec.item, balloonStyle.padZero);

        return (
          <div
            key={`${spec.item}_${idx}`}
            data-balloon-marker="true"
            onMouseDown={(e) => handleMarkerMouseDown(e, idx)}
            onContextMenu={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onRemoveBalloonPosition(idx);
            }}
            title={`球標 ${label}：${spec.dimension || "未填"} (${spec.tolerancePlus || "一般"}/${spec.toleranceMinus || "一般"})\n左鍵拖曳微調｜按 Delete 或點右上角 × 刪除球標與項次｜右鍵僅移除位置`}
            style={{
              left: `${spec.balloonPosition.xPercent}%`,
              top: `${spec.balloonPosition.yPercent}%`,
              width: `${diameter}px`,
              height: `${diameter}px`,
              fontSize: `${fontSize}px`,
              backgroundColor: balloonStyle.bgColor,
              color: balloonStyle.textColor,
              border: `2px solid ${balloonStyle.borderColor}`,
            }}
            className={`absolute flex -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full font-extrabold shadow-md transition-transform ${
              isDragging ? "z-40 scale-110 cursor-grabbing" : "cursor-grab hover:scale-110"
            } ${isSelected ? "z-30 ring-4 ring-blue-500/60" : ""}`}
          >
            {label}
            {isSelected && mode === "balloon" && (
              <button
                type="button"
                onMouseDown={(e) => e.stopPropagation()}
                onClick={(e) => {
                  e.stopPropagation();
                  onDeleteBalloonAndSpec(idx);
                }}
                title={`刪除球標 ${label} 與對應項次 (Delete)`}
                className="absolute -right-2 -top-2 flex h-4 w-4 items-center justify-center rounded-full border border-white bg-red-600 text-[10px] font-bold leading-none text-white shadow hover:bg-red-700"
              >
                ×
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}
