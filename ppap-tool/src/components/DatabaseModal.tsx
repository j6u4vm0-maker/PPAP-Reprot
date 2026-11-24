"use client";

import React, { useEffect, useRef, useState } from "react";
import type { DrawingRecord, PatchDrawingMetaPayload } from "@/types/ppap";
import { DatabaseDrawingCard } from "./DatabaseDrawingCard";

interface DatabaseModalProps {
  isOpen: boolean;
  currentDrawingId: string | null;
  onClose: () => void;
  onSearch: (query: string) => Promise<DrawingRecord[]>;
  onLoadDrawing: (record: DrawingRecord) => Promise<void>;
  onPatchDrawingMeta: (id: string, payload: PatchDrawingMetaPayload) => Promise<DrawingRecord>;
  onDeleteDrawing: (record: DrawingRecord) => Promise<void>;
  onBackupDb: () => Promise<void>;
  onRestoreDbFile: (file: File) => Promise<void>;
}

export function DatabaseModal({
  isOpen,
  currentDrawingId,
  onClose,
  onSearch,
  onLoadDrawing,
  onPatchDrawingMeta,
  onDeleteDrawing,
  onBackupDb,
  onRestoreDbFile,
}: DatabaseModalProps): React.ReactElement | null {
  const [searchText, setSearchText] = useState<string>("");
  const [records, setRecords] = useState<DrawingRecord[]>([]);
  const restoreInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    let active = true;
    const timer = setTimeout(() => {
      void onSearch(searchText.trim())
        .then((list) => {
          if (active) setRecords(list);
        })
        .catch(() => {});
    }, 150);
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [isOpen, onSearch, searchText]);

  if (!isOpen) return null;

  const refreshList = async (): Promise<void> => {
    const list = await onSearch(searchText.trim());
    setRecords(list);
  };

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/55 p-4"
    >
      <div className="flex max-h-[88vh] w-full max-w-4xl flex-col overflow-hidden rounded-xl bg-white shadow-2xl">
        <div className="flex items-start justify-between border-b border-slate-200 px-5 py-3.5">
          <div>
            <h3 className="text-base font-bold text-slate-900">📂 本地圖紙資料庫系統</h3>
            <p className="text-xs text-slate-500">
              可一鍵呼叫還原 PDF 與球標規格，或直接在清單中快速編輯／刪除圖紙紀錄
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded p-1 text-slate-500 hover:bg-slate-100"
          >
            ✕
          </button>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 bg-slate-50 px-5 py-2.5">
          <input
            type="text"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            placeholder="🔍 搜尋料號 (如 E4010-BLUE)、測試標準/圖號 (如 KA-95436-C) 或品名..."
            className="min-w-[260px] max-w-md flex-1 rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs focus:border-blue-600 focus:outline-none"
          />
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => void onBackupDb()}
              className="rounded-md border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100"
            >
              ⬇️ 匯出整庫備份
            </button>
            <button
              type="button"
              onClick={() => restoreInputRef.current?.click()}
              className="rounded-md border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100"
            >
              ⬆️ 匯入備份
            </button>
            <input
              ref={restoreInputRef}
              type="file"
              accept=".json"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) void onRestoreDbFile(f).then(refreshList);
                e.target.value = "";
              }}
              className="hidden"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4">
          {records.length === 0 ? (
            <div className="py-10 text-center text-xs text-slate-400">查無符合條件的圖紙資料</div>
          ) : (
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              {records.map((rec) => (
                <DatabaseDrawingCard
                  key={rec.id}
                  record={rec}
                  isCurrent={rec.id === currentDrawingId}
                  onLoad={() => {
                    onClose();
                    void onLoadDrawing(rec);
                  }}
                  onPatch={async (payload) => {
                    await onPatchDrawingMeta(rec.id, payload);
                    await refreshList();
                  }}
                  onDelete={async () => {
                    if (!confirm(`確定要從圖紙資料庫永久刪除「${rec.partNo}」嗎？`)) return;
                    await onDeleteDrawing(rec);
                    await refreshList();
                  }}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
