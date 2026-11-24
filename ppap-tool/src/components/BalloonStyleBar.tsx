"use client";

import React from "react";
import type { BalloonPresetKey, BalloonStyle, CanvasMode } from "@/types/ppap";
import { BALLOON_PRESETS } from "@/utils/constants";

interface BalloonStyleBarProps {
  mode: CanvasMode;
  hasCrop: boolean;
  placedBalloonCount: number;
  selectedBalloonLabel: string | null;
  balloonStyle: BalloonStyle;
  onModeChange: (mode: CanvasMode) => void;
  onClearCrop: () => void;
  onDeleteSelectedBalloon: () => void;
  onClearAllBalloons: () => void;
  onBalloonStyleChange: (next: Partial<BalloonStyle>) => void;
  onDownloadPng: () => void;
}

export function BalloonStyleBar({
  mode,
  hasCrop,
  placedBalloonCount,
  selectedBalloonLabel,
  balloonStyle,
  onModeChange,
  onClearCrop,
  onDeleteSelectedBalloon,
  onClearAllBalloons,
  onBalloonStyleChange,
  onDownloadPng,
}: BalloonStyleBarProps): React.ReactElement {
  const handlePresetChange = (presetKey: BalloonPresetKey): void => {
    const preset = BALLOON_PRESETS[presetKey];
    onBalloonStyleChange({
      preset: presetKey,
      bgColor: preset.bgColor,
      textColor: preset.textColor,
      borderColor: preset.borderColor,
    });
  };

  return (
    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 bg-slate-50 px-3 py-1.5">
      <div className="flex items-center gap-1.5">
        <button
          type="button"
          onClick={() => onModeChange("balloon")}
          className={`rounded-md border px-2.5 py-1 text-xs font-semibold ${
            mode === "balloon"
              ? "border-slate-900 bg-slate-900 text-white"
              : "border-slate-300 bg-white text-slate-600 hover:bg-slate-100"
          }`}
        >
          🎯 標記球標
        </button>
        <button
          type="button"
          onClick={() => onModeChange("crop")}
          className={`rounded-md border px-2.5 py-1 text-xs font-semibold ${
            mode === "crop"
              ? "border-slate-900 bg-slate-900 text-white"
              : "border-slate-300 bg-white text-slate-600 hover:bg-slate-100"
          }`}
        >
          ✂️ 框選 P3 裁切
        </button>
        {hasCrop && (
          <button
            type="button"
            onClick={onClearCrop}
            className="rounded-md px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-50"
          >
            刪除裁切
          </button>
        )}
        {selectedBalloonLabel && (
          <button
            type="button"
            onClick={onDeleteSelectedBalloon}
            className="rounded-md border border-red-200 bg-red-50 px-2 py-1 text-xs font-semibold text-red-700 hover:bg-red-100"
            title="刪除目前選取的球標與對應規格列（或直接按鍵盤 Delete）"
          >
            🗑️ 刪除球標 [{selectedBalloonLabel}]
          </button>
        )}
        {placedBalloonCount > 0 && (
          <button
            type="button"
            onClick={onClearAllBalloons}
            className="rounded-md px-2 py-1 text-xs font-medium text-slate-600 hover:bg-slate-200"
            title="清除圖面上所有球標位置（保留規格列）"
          >
            清除球標
          </button>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-2.5 text-xs text-slate-600">
        <label className="flex items-center gap-1">
          <span>樣式</span>
          <select
            value={balloonStyle.preset}
            onChange={(e) => handlePresetChange(e.target.value as BalloonPresetKey)}
            className="rounded border border-slate-300 bg-white px-1.5 py-0.5 text-xs text-slate-800"
          >
            {(Object.keys(BALLOON_PRESETS) as BalloonPresetKey[]).map((key) => (
              <option key={key} value={key}>
                {BALLOON_PRESETS[key].label}
              </option>
            ))}
          </select>
        </label>

        <label className="flex items-center gap-1">
          <span>大小</span>
          <input
            type="range"
            min={10}
            max={34}
            value={balloonStyle.radius}
            onChange={(e) => onBalloonStyleChange({ radius: Number(e.target.value) })}
            className="w-16 accent-blue-600"
          />
          <span className="w-5 font-mono text-[11px]">{balloonStyle.radius}</span>
        </label>

        <label className="flex cursor-pointer select-none items-center gap-1">
          <input
            type="checkbox"
            checked={balloonStyle.padZero}
            onChange={(e) => onBalloonStyleChange({ padZero: e.target.checked })}
          />
          <span>補零(01)</span>
        </label>

        <button
          type="button"
          onClick={onDownloadPng}
          className="rounded border border-slate-300 bg-white px-2 py-0.5 text-xs font-semibold text-slate-700 hover:bg-slate-100"
        >
          🖼️ 下載球標圖
        </button>
      </div>
    </div>
  );
}
