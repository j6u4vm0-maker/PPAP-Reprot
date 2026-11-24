"use client";

import React, { useState } from "react";
import type { EquipmentItem } from "@/types/ppap";

interface EquipmentLibraryModalProps {
  isOpen: boolean;
  equipmentList: EquipmentItem[];
  onClose: () => void;
  onAdd: (label: string) => Promise<void>;
  onUpdate: (id: string, label: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onInsertToReport: (label: string) => void;
}

export function EquipmentLibraryModal({
  isOpen,
  equipmentList,
  onClose,
  onAdd,
  onUpdate,
  onDelete,
  onInsertToReport,
}: EquipmentLibraryModalProps): React.ReactElement | null {
  const [newLabel, setNewLabel] = useState<string>("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingVal, setEditingVal] = useState<string>("");
  const [isBusy, setIsBusy] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleAdd = async (): Promise<void> => {
    const trimmed = newLabel.trim();
    if (!trimmed) return;
    setIsBusy(true);
    try {
      await onAdd(trimmed);
      setNewLabel("");
    } finally {
      setIsBusy(false);
    }
  };

  const handleSaveEdit = async (id: string): Promise<void> => {
    const trimmed = editingVal.trim();
    if (!trimmed) return;
    setIsBusy(true);
    try {
      await onUpdate(id, trimmed);
      setEditingId(null);
      setEditingVal("");
    } finally {
      setIsBusy(false);
    }
  };

  const handleDelete = async (item: EquipmentItem): Promise<void> => {
    if (!confirm(`確定要從常用儀器庫刪除「${item.label}」嗎？`)) return;
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
            <h3 className="text-base font-bold text-slate-900">⚙️ 常用測試儀器庫管理</h3>
            <p className="text-xs text-slate-500">
              所有儀器設定皆儲存於本地資料庫，支援完整新增、編輯與刪除
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

        <div className="border-b border-slate-200 bg-slate-50 px-5 py-3">
          <div className="flex gap-2">
            <input
              type="text"
              value={newLabel}
              onChange={(e) => setNewLabel(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") void handleAdd();
              }}
              placeholder="新增常用儀器，例如：游標卡尺 Caliper : S200-01 內-032"
              className="flex-1 rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs focus:border-blue-600 focus:outline-none"
            />
            <button
              type="button"
              disabled={isBusy}
              onClick={() => void handleAdd()}
              className="rounded-md bg-blue-600 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
            >
              ＋ 新增儀器
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-3">
          {equipmentList.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-400">目前尚無常用儀器</div>
          ) : (
            <div className="flex flex-col gap-2">
              {equipmentList.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs"
                >
                  {editingId === item.id ? (
                    <>
                      <input
                        type="text"
                        value={editingVal}
                        onChange={(e) => setEditingVal(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") void handleSaveEdit(item.id);
                        }}
                        className="flex-1 rounded border border-blue-500 px-2 py-1 text-xs"
                      />
                      <button
                        type="button"
                        disabled={isBusy}
                        onClick={() => void handleSaveEdit(item.id)}
                        className="rounded bg-blue-600 px-2.5 py-1 font-semibold text-white"
                      >
                        儲存
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditingId(null)}
                        className="rounded px-2 py-1 text-slate-500 hover:bg-slate-100"
                      >
                        取消
                      </button>
                    </>
                  ) : (
                    <>
                      <span className="flex-1 font-medium text-slate-800">{item.label}</span>
                      <div className="flex shrink-0 items-center gap-1">
                        <button
                          type="button"
                          onClick={() => onInsertToReport(item.label)}
                          className="rounded bg-emerald-50 px-2 py-1 font-semibold text-emerald-700 hover:bg-emerald-100"
                        >
                          加入報告
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setEditingId(item.id);
                            setEditingVal(item.label);
                          }}
                          className="rounded px-2 py-1 font-semibold text-blue-700 hover:bg-blue-50"
                        >
                          編輯
                        </button>
                        <button
                          type="button"
                          disabled={isBusy}
                          onClick={() => void handleDelete(item)}
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
          )}
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
