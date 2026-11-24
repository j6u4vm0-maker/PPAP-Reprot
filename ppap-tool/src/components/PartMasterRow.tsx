"use client";

import React, { useState } from "react";
import type { PartMasterInput, PartMasterItem } from "@/types/ppap";

interface PartMasterRowProps {
  item: PartMasterItem;
  onApply: (item: PartMasterItem) => void;
  onUpdate: (id: string, payload: PartMasterInput) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

export function PartMasterRow({
  item,
  onApply,
  onUpdate,
  onDelete,
}: PartMasterRowProps): React.ReactElement {
  const [editing, setEditing] = useState<boolean>(false);
  const [draft, setDraft] = useState<PartMasterInput>({
    partNo: item.partNo,
    partName: item.partName,
    testStandard: item.testStandard,
    revision: item.revision,
    issueDate: item.issueDate,
  });
  const [busy, setBusy] = useState<boolean>(false);

  const handleSave = async (): Promise<void> => {
    if (!draft.partNo.trim() && !draft.testStandard.trim()) return;
    setBusy(true);
    try {
      await onUpdate(item.id, draft);
      setEditing(false);
    } finally {
      setBusy(false);
    }
  };

  if (editing) {
    return (
      <tr className="border-b border-blue-200 bg-blue-50/50 text-xs">
        <td className="p-1.5">
          <input
            type="text"
            value={draft.partNo}
            onChange={(e) => setDraft((p) => ({ ...p, partNo: e.target.value }))}
            placeholder="料號"
            className="w-full rounded border border-slate-300 bg-white px-1.5 py-1 font-mono text-xs"
          />
        </td>
        <td className="p-1.5">
          <input
            type="text"
            value={draft.partName}
            onChange={(e) => setDraft((p) => ({ ...p, partName: e.target.value }))}
            placeholder="產品名稱"
            className="w-full rounded border border-slate-300 bg-white px-1.5 py-1 text-xs"
          />
        </td>
        <td className="p-1.5">
          <input
            type="text"
            value={draft.testStandard}
            onChange={(e) => setDraft((p) => ({ ...p, testStandard: e.target.value }))}
            placeholder="圖號"
            className="w-full rounded border border-slate-300 bg-white px-1.5 py-1 font-mono text-xs"
          />
        </td>
        <td className="p-1.5">
          <input
            type="text"
            value={draft.revision}
            onChange={(e) => setDraft((p) => ({ ...p, revision: e.target.value }))}
            placeholder="版次"
            className="w-full rounded border border-slate-300 bg-white px-1.5 py-1 text-center font-mono text-xs"
          />
        </td>
        <td className="p-1.5">
          <input
            type="text"
            value={draft.issueDate}
            onChange={(e) => setDraft((p) => ({ ...p, issueDate: e.target.value }))}
            placeholder="YYYY/MM/DD"
            className="w-full rounded border border-slate-300 bg-white px-1.5 py-1 text-center font-mono text-xs"
          />
        </td>
        <td className="whitespace-nowrap p-1.5 text-center">
          <button
            type="button"
            disabled={busy}
            onClick={() => void handleSave()}
            className="mr-1 rounded bg-blue-600 px-2 py-1 text-[11px] font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
          >
            儲存
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() => {
              setDraft({
                partNo: item.partNo,
                partName: item.partName,
                testStandard: item.testStandard,
                revision: item.revision,
                issueDate: item.issueDate,
              });
              setEditing(false);
            }}
            className="rounded border border-slate-300 bg-white px-2 py-1 text-[11px] text-slate-600 hover:bg-slate-100"
          >
            取消
          </button>
        </td>
      </tr>
    );
  }

  return (
    <tr className="border-b border-slate-100 text-xs hover:bg-slate-50">
      <td className="p-2 font-mono font-bold text-slate-900">{item.partNo || "—"}</td>
      <td className="max-w-[220px] truncate p-2 text-slate-700" title={item.partName}>
        {item.partName || "—"}
      </td>
      <td className="p-2 font-mono text-slate-800">{item.testStandard || "—"}</td>
      <td className="p-2 text-center font-mono text-slate-700">{item.revision || "—"}</td>
      <td className="p-2 text-center font-mono text-slate-600">{item.issueDate || "—"}</td>
      <td className="whitespace-nowrap p-1.5 text-center">
        <button
          type="button"
          onClick={() => onApply(item)}
          className="mr-1 rounded bg-emerald-600 px-2 py-1 text-[11px] font-semibold text-white hover:bg-emerald-700"
        >
          帶入
        </button>
        <button
          type="button"
          onClick={() => setEditing(true)}
          className="mr-1 rounded border border-slate-300 bg-white px-2 py-1 text-[11px] font-semibold text-slate-700 hover:bg-slate-100"
        >
          編輯
        </button>
        <button
          type="button"
          onClick={() => {
            if (!confirm(`確定刪除主檔「${item.partNo || item.testStandard}」嗎？`)) return;
            void onDelete(item.id);
          }}
          className="rounded px-2 py-1 text-[11px] font-semibold text-red-600 hover:bg-red-50"
        >
          刪除
        </button>
      </td>
    </tr>
  );
}
