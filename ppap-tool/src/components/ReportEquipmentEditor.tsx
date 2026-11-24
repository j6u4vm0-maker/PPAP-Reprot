"use client";

import React, { useState } from "react";
import type { EquipmentItem } from "@/types/ppap";

interface ReportEquipmentEditorProps {
  equipment: string[];
  equipmentLibrary: EquipmentItem[];
  onChangeEquipment: (next: string[]) => void;
  onOpenLibraryManager: () => void;
}

export function ReportEquipmentEditor({
  equipment,
  equipmentLibrary,
  onChangeEquipment,
  onOpenLibraryManager,
}: ReportEquipmentEditorProps): React.ReactElement {
  const [newEquipText, setNewEquipText] = useState<string>("");
  const [editingIdx, setEditingIdx] = useState<number | null>(null);
  const [editingVal, setEditingVal] = useState<string>("");

  const handleAdd = (label: string): void => {
    const trimmed = label.trim();
    if (!trimmed || equipment.includes(trimmed)) return;
    onChangeEquipment([...equipment, trimmed]);
  };

  const handleSaveEdit = (idx: number): void => {
    const trimmed = editingVal.trim();
    if (!trimmed) return;
    const next = [...equipment];
    next[idx] = trimmed;
    onChangeEquipment(next);
    setEditingIdx(null);
    setEditingVal("");
  };

  const handleDelete = (idx: number): void => {
    onChangeEquipment(equipment.filter((_, i) => i !== idx));
    if (editingIdx === idx) setEditingIdx(null);
  };

  return (
    <div className="col-span-2 rounded-md border border-slate-200 bg-slate-50 p-2.5">
      <div className="mb-1.5 flex items-center justify-between">
        <span className="text-xs font-semibold text-slate-700">
          本報告測試儀器 (P3 Test Equipment)
        </span>
        <button
          type="button"
          onClick={onOpenLibraryManager}
          className="rounded border border-blue-200 bg-blue-50 px-2 py-0.5 text-[11px] font-semibold text-blue-700 hover:bg-blue-100"
        >
          ⚙️ 管理常用儀器庫（新增/編輯/刪除）
        </button>
      </div>

      <div className="mb-2 flex flex-wrap gap-1">
        {equipmentLibrary.map((eq) => (
          <button
            key={eq.id}
            type="button"
            onClick={() => handleAdd(eq.label)}
            className="rounded-full border border-slate-300 bg-white px-2 py-0.5 text-[11px] text-slate-700 hover:border-blue-500 hover:bg-blue-50 hover:text-blue-700"
          >
            ＋ {eq.label}
          </button>
        ))}
      </div>

      <div className="mb-2 flex flex-col gap-1">
        {equipment.map((eq, idx) => (
          <div
            key={`${eq}_${idx}`}
            className="flex items-center justify-between gap-2 rounded border border-slate-200 bg-white px-2 py-1 text-xs"
          >
            {editingIdx === idx ? (
              <>
                <input
                  type="text"
                  value={editingVal}
                  onChange={(e) => setEditingVal(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleSaveEdit(idx);
                  }}
                  className="flex-1 rounded border border-blue-400 px-1.5 py-0.5 text-xs"
                />
                <button
                  type="button"
                  onClick={() => handleSaveEdit(idx)}
                  className="rounded bg-blue-600 px-2 py-0.5 text-[11px] font-semibold text-white"
                >
                  儲存
                </button>
                <button
                  type="button"
                  onClick={() => setEditingIdx(null)}
                  className="text-[11px] text-slate-500"
                >
                  取消
                </button>
              </>
            ) : (
              <>
                <span className="flex-1 truncate text-slate-800">{eq}</span>
                <div className="flex shrink-0 items-center gap-1">
                  <button
                    type="button"
                    onClick={() => {
                      setEditingIdx(idx);
                      setEditingVal(eq);
                    }}
                    className="rounded px-1.5 py-0.5 text-[11px] text-blue-700 hover:bg-blue-50"
                  >
                    編輯
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(idx)}
                    className="rounded px-1.5 py-0.5 text-[11px] text-red-600 hover:bg-red-50"
                  >
                    刪除
                  </button>
                </div>
              </>
            )}
          </div>
        ))}
      </div>

      <div className="flex gap-1.5">
        <input
          type="text"
          value={newEquipText}
          onChange={(e) => setNewEquipText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              handleAdd(newEquipText);
              setNewEquipText("");
            }
          }}
          placeholder="自訂新增此報告儀器，例如：高度規 Height Gauge : S200-03 內-012"
          className="flex-1 rounded border border-slate-300 bg-white px-2 py-1 text-xs"
        />
        <button
          type="button"
          onClick={() => {
            handleAdd(newEquipText);
            setNewEquipText("");
          }}
          className="rounded bg-slate-800 px-2.5 py-1 text-xs font-semibold text-white hover:bg-slate-700"
        >
          新增
        </button>
      </div>
    </div>
  );
}
