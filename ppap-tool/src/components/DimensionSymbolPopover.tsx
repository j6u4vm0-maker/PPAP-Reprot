"use client";

import React, { useEffect, useState } from "react";
import type { SymbolInsertMode, SymbolItem } from "@/types/ppap";

interface DimensionSymbolPopoverProps {
  anchorEl: HTMLInputElement | null;
  symbols: SymbolItem[];
  onSelectSymbol: (symbol: SymbolItem) => void;
  onOpenManager: () => void;
}

const MODE_HINT: Record<SymbolInsertMode, string> = {
  wrap: "包覆/取消括號",
  prefix: "前綴切換",
  suffix: "後綴切換",
  insert: "游標處插入",
};

/**
 * 聚焦 Dimension 輸入框時於正下方浮動彈出的快速符號條（自動避免被捲軸容器裁切）
 */
export function DimensionSymbolPopover({
  anchorEl,
  symbols,
  onSelectSymbol,
  onOpenManager,
}: DimensionSymbolPopoverProps): React.ReactElement | null {
  const [coords, setCoords] = useState<{ top: number; left: number; above: boolean } | null>(null);

  useEffect(() => {
    if (!anchorEl) {
      setCoords(null);
      return;
    }

    const updatePosition = (): void => {
      const rect = anchorEl.getBoundingClientRect();
      const popoverHeight = 76;
      const popoverWidth = 360;
      const spaceBelow = window.innerHeight - rect.bottom;
      const showAbove = spaceBelow < popoverHeight + 12 && rect.top > popoverHeight + 12;
      const maxLeft = Math.max(12, window.innerWidth - popoverWidth - 12);
      const clampedLeft = Math.min(Math.max(12, rect.left), maxLeft);

      setCoords({
        top: showAbove ? rect.top - 6 : rect.bottom + 6,
        left: clampedLeft,
        above: showAbove,
      });
    };

    updatePosition();
    window.addEventListener("scroll", updatePosition, true);
    window.addEventListener("resize", updatePosition);
    return () => {
      window.removeEventListener("scroll", updatePosition, true);
      window.removeEventListener("resize", updatePosition);
    };
  }, [anchorEl]);

  if (!anchorEl || !coords) return null;

  return (
    <div
      onMouseDown={(e) => e.preventDefault()}
      style={{
        top: `${coords.top}px`,
        left: `${coords.left}px`,
        transform: coords.above ? "translateY(-100%)" : undefined,
      }}
      className="fixed z-50 w-[356px] max-w-[calc(100vw-24px)] rounded-lg border border-blue-200 bg-white p-2 shadow-xl ring-1 ring-slate-900/10"
    >
      <div className="mb-1.5 flex items-center justify-between border-b border-slate-100 pb-1">
        <span className="text-[11px] font-bold text-slate-600">⚡ 快速工程符號（點選套用）</span>
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={onOpenManager}
          className="rounded bg-blue-50 px-1.5 py-0.5 text-[10.5px] font-semibold text-blue-700 hover:bg-blue-100"
        >
          ⚙️ 管理符號
        </button>
      </div>

      <div className="flex flex-wrap gap-1">
        {symbols.map((sym) => (
          <button
            key={sym.id}
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => onSelectSymbol(sym)}
            title={`${sym.label}（${MODE_HINT[sym.mode]}）`}
            className="min-w-[32px] rounded border border-slate-300 bg-slate-50 px-2 py-1 font-mono text-xs font-bold text-slate-800 transition hover:border-blue-500 hover:bg-blue-50 hover:text-blue-700 active:scale-95"
          >
            {sym.label}
          </button>
        ))}
      </div>
    </div>
  );
}
