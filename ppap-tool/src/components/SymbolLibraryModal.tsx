"use client";

import React, { useState } from "react";
import type { SymbolInsertMode, SymbolItem } from "@/types/ppap";

interface SymbolLibraryModalProps {
  isOpen: boolean;
  symbols: SymbolItem[];
  onClose: () => void;
  onAdd: (payload: { label: string; value: string; mode: SymbolInsertMode }) => Promise<void>;
  onUpdate: (
    id: string,
    payload: { label: string; value: string; mode: SymbolInsertMode }
  ) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

const MODE_LABELS: Record<SymbolInsertMode, string> = {
  wrap: "包覆前後 (如 (7.40))",
  prefix: "加在前方 (如 Ø3.20)",
  suffix: "加在後方 (如 45° / MAX)",
  insert: "游標處插入 (如 ±)",
};

export function SymbolLibraryModal({
  isOpen,
  symbols,
  onClose,
  onAdd,
  onUpdate,
  onDelete,
}: SymbolLibraryModalProps): React.ReactElement | null {
  const [newLabel, setNewLabel] = useState<string>("");
  const [newValue, setNewValue] = useState<string>("");
  const [newMode, setNewMode] = useState<SymbolInsertMode>("prefix");

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editLabel, setEditLabel] = useState<string>("");
  const [editValue, setEditValue] = useState<string>("");
  const [editMode, setEditMode] = useState<SymbolInsertMode>("prefix");
  const [isBusy, setIsBusy] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleAdd = async (): Promise<void> => {
    const val = newValue.trim();
    const lbl = (newLabel.trim() || val).trim();
    if (!val) return;
    setIsBusy(true);
    try {
      await onAdd({ label: lbl, value: val, mode: newMode });
      setNewLabel("");
      setNewValue("");
    } finally {
      setIsBusy(false);
    }
  };

  const handleSaveEdit = async (id: string): Promise<void> => {
    const val = editValue.trim();
    const lbl = (editLabel.trim() || val).trim();
    if (!val || !lbl) return;
    setIsBusy(true);
    try {
      await onUpdate(id, { label: lbl, value: val, mode: editMode });
      setEditingId(null);
    } finally {
      setIsBusy(false);
    }
  };

  const handleDelete = async (item: SymbolItem): Promise<void> => {
    if (!confirm(`確定要刪除快速符號「${item.label}」嗎？`)) return;
    setIsBusy(true);
    try {
      await onDelete(item.id);
    } finally {
      setIsBusy(false);
    }
  };

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/55 p-4"
    >
      <div className="flex max-h-[85vh] w-full max-w-xl flex-col overflow-hidden rounded-xl bg-white shadow-2xl">
        <div className="flex items-start justify-between border-b border-slate-200 px-5 py-3.5">
          <div>
            <h3 className="text-base font-bold text-slate-900">⚙️ 快速工程符號庫管理</h3>
            <p className="text-xs text-slate-500">
              管理 Dimension 浮動快捷符號條，儲存於本地資料庫（支援新增、編輯、刪除）
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

        {/* Add Form */}
        <div className="border-b border-slate-200 bg-slate-50 px-5 py-3">
          <div className="grid grid-cols-12 gap-2">
            <input
              type="text"
              value={newValue}
              onChange={(e) => setNewValue(e.target.value)}
              placeholder="符號內容 (如 2× / SR)"
              className="col-span-4 rounded-md border border-slate-300 bg-white px-2.5 py-1.5 font-mono text-xs"
            />
            <input
              type="text"
              value={newLabel}
              onChange={(e) => setNewLabel(e.target.value)}
              placeholder="按鈕顯示 (可留空)"
              className="col-span-3 rounded-md border border-slate-300 bg-white px-2.5 py-1.5 text-xs"
            />
            <select
              value={newMode}
              onChange={(e) => setNewMode(e.target.value as SymbolInsertMode)}
              className="col-span-3 rounded-md border border-slate-300 bg-white px-2 py-1.5 text-xs"
            >
              {(Object.keys(MODE_LABELS) as SymbolInsertMode[]).map((m) => (
                <option key={m} value={m}>
                  {MODE_LABELS[m]}
                </option>
              ))}
            </select>
            <button
              type="button"
              disabled={isBusy}
              onClick={() => void handleAdd()}
              className="col-span-2 rounded-md bg-blue-600 px-2 py-1.5 text-xs font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
            >
              ＋ 新增
            </button>
          </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto px-5 py-3">
          <div className="flex flex-col gap-1.5">
            {symbols.map((sym) => (
              <div
                key={sym.id}
                className="flex items-center justify-between gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs"
              >
                {editingId === sym.id ? (
                  <div className="grid flex-1 grid-cols-12 items-center gap-1.5">
                    <input
                      type="text"
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      className="col-span-3 rounded border border-blue-500 px-2 py-1 font-mono text-xs"
                    />
                    <input
                      type="text"
                      value={editLabel}
                      onChange={(e) => setEditLabel(e.target.value)}
                      className="col-span-3 rounded border border-blue-500 px-2 py-1 text-xs"
                    />
                    <select
                      value={editMode}
                      onChange={(e) => setEditMode(e.target.value as SymbolInsertMode)}
                      className="col-span-3 rounded border border-blue-500 px-1.5 py-1 text-xs"
                    >
                      {(Object.keys(MODE_LABELS) as SymbolInsertMode[]).map((m) => (
                        <option key={m} value={m}>
                          {MODE_LABELS[m]}
                        </option>
                      ))}
                    </select>
                    <div className="col-span-3 flex justify-end gap-1">
                      <button
                        type="button"
                        disabled={isBusy}
                        onClick={() => void handleSaveEdit(sym.id)}
                        className="rounded bg-blue-600 px-2 py-1 font-semibold text-white"
                      >
                        儲存
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditingId(null)}
                        className="rounded px-1.5 py-1 text-slate-500 hover:bg-slate-100"
                      >
                        取消
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center gap-2.5">
                      <span className="inline-flex min-w-[38px] justify-center rounded border border-slate-300 bg-slate-100 px-2 py-0.5 font-mono font-bold text-slate-900">
                        {sym.label}
                      </span>
                      <span className="font-mono text-slate-500">值：{sym.value}</span>
                      <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10.5px] text-slate-600">
                        {MODE_LABELS[sym.mode]}
                      </span>
                    </div>
                    <div className="flex shrink-0 items-center gap-1">
                      <button
                        type="button"
                        onClick={() => {
                          setEditingId(sym.id);
                          setEditLabel(sym.label);
                          setEditValue(sym.value);
                          setEditMode(sym.mode);
                        }}
                        className="rounded px-2 py-1 font-semibold text-blue-700 hover:bg-blue-50"
                      >
                        編輯
                      </button>
                      <button
                        type="button"
                        disabled={isBusy}
                        onClick={() => void handleDelete(sym)}
                        className="rounded px-2 py-1 font-semibold text-red-600 hover:bg-red-50"
                      >
                        刪除
                      </button>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-end border-t border-slate-200 bg-slate-50 px-5 py-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-md border border-slate-300 bg-white px-4 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100"
          >
            關閉
          </button>
        </div>
      </div>
    </div>
  );
}
