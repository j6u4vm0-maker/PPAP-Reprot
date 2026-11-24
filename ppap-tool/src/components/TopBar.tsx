"use client";

import React, { useRef } from "react";

interface TopBarProps {
  currentDocLabel: string;
  isDirty: boolean;
  hasId: boolean;
  dbCount: number;
  onOpenDb: () => void;
  onNewDrawing: () => void;
  onImportJsonFile: (file: File) => void;
  onSaveAsNew: () => void;
  onSaveDb: () => void;
  onExportWord: () => void;
  onExportJson: () => void;
}

export function TopBar({
  currentDocLabel,
  isDirty,
  hasId,
  dbCount,
  onOpenDb,
  onNewDrawing,
  onImportJsonFile,
  onSaveAsNew,
  onSaveDb,
  onExportWord,
  onExportJson,
}: TopBarProps): React.ReactElement {
  const jsonInputRef = useRef<HTMLInputElement>(null);

  const handleJsonChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const file = e.target.files?.[0];
    if (file) onImportJsonFile(file);
    e.target.value = "";
  };

  return (
    <header className="flex h-14 shrink-0 items-center justify-between gap-3 border-b border-slate-800 bg-slate-900 px-4 text-slate-50">
      <div className="flex min-w-0 items-center gap-3">
        <div className="shrink-0 rounded-md bg-white px-2.5 py-1 text-sm font-black tracking-wide text-slate-900">
          KST
        </div>
        <div className="min-w-0">
          <h1 className="truncate text-sm font-bold leading-tight">
            PPAP 尺寸球標與規格移轉工具
          </h1>
          <span className="block text-[11px] text-slate-400">
            實驗室量測前置建檔系統 (Next.js + TS)
          </span>
        </div>
        <div className="hidden max-w-[260px] items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs text-slate-200 md:flex">
          <span
            className={`h-2 w-2 shrink-0 rounded-full ${
              isDirty || !hasId ? "bg-amber-400" : "bg-emerald-400"
            }`}
          />
          <span className="truncate">{currentDocLabel}</span>
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-1.5">
        <button
          type="button"
          onClick={onOpenDb}
          className="inline-flex items-center gap-1.5 rounded-md border border-white/20 bg-white/10 px-2.5 py-1.5 text-xs font-semibold text-white transition hover:bg-white/20"
        >
          <span>📂</span> 圖紙資料庫
          <span className="rounded-full bg-blue-500 px-1.5 py-0.5 text-[11px] font-bold">
            {dbCount}
          </span>
        </button>

        <button
          type="button"
          onClick={onNewDrawing}
          className="inline-flex items-center gap-1 rounded-md border border-white/20 bg-white/10 px-2.5 py-1.5 text-xs font-semibold text-white transition hover:bg-white/20"
        >
          ＋ 新增圖紙
        </button>

        <button
          type="button"
          onClick={() => jsonInputRef.current?.click()}
          className="inline-flex items-center gap-1 rounded-md border border-white/20 bg-white/10 px-2.5 py-1.5 text-xs font-semibold text-white transition hover:bg-white/20"
        >
          📥 匯入 JSON
        </button>
        <input
          ref={jsonInputRef}
          type="file"
          accept=".json"
          onChange={handleJsonChange}
          className="hidden"
        />

        <div className="mx-1 h-5 w-px bg-white/20" />

        <button
          type="button"
          onClick={onSaveAsNew}
          className="inline-flex items-center gap-1 rounded-md bg-slate-700 px-2.5 py-1.5 text-xs font-semibold text-white transition hover:bg-slate-600"
        >
          📑 另存新料號
        </button>

        <button
          type="button"
          onClick={onSaveDb}
          className="inline-flex items-center gap-1 rounded-md bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-blue-700"
        >
          💾 儲存至資料庫
        </button>

        <button
          type="button"
          onClick={onExportWord}
          className="inline-flex items-center gap-1 rounded-md bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-indigo-700"
          title="匯出與範例報告版面一致的 A4 直式 Word (.docx)"
        >
          📄 匯出 Word
        </button>

        <button
          type="button"
          onClick={onExportJson}
          className="inline-flex items-center gap-1 rounded-md bg-teal-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-teal-700"
        >
          🚀 匯出移轉 JSON
        </button>
      </div>
    </header>
  );
}
