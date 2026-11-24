"use client";

import React, { useState } from "react";
import type { DrawingRecord, PatchDrawingMetaPayload } from "@/types/ppap";
import { formatDateTime } from "@/utils/specFormatter";

interface DatabaseDrawingCardProps {
  record: DrawingRecord;
  isCurrent: boolean;
  onLoad: () => void;
  onPatch: (payload: PatchDrawingMetaPayload) => Promise<void>;
  onDelete: () => Promise<void>;
}

export function DatabaseDrawingCard({
  record,
  isCurrent,
  onLoad,
  onPatch,
  onDelete,
}: DatabaseDrawingCardProps): React.ReactElement {
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [draft, setDraft] = useState<PatchDrawingMetaPayload>({});
  const [isBusy, setIsBusy] = useState<boolean>(false);

  const specCount = record.page4?.specifications?.length || 0;
  const placedCount = (record.page4?.specifications || []).filter((s) => s.balloonPosition).length;

  const startEdit = (): void => {
    setDraft({
      partNo: record.partNo,
      testStandard: record.page3.testStandard,
      revision: record.page3.revision,
      issueDate: record.page3.issueDate,
      partName: record.page4.partName,
      notes: record.notes,
    });
    setIsEditing(true);
  };

  const handleSave = async (): Promise<void> => {
    setIsBusy(true);
    try {
      await onPatch(draft);
      setIsEditing(false);
    } finally {
      setIsBusy(false);
    }
  };

  if (isEditing) {
    return (
      <div className="flex flex-col gap-1.5 rounded-lg border border-blue-400 bg-blue-50/30 p-3 text-xs">
        <div className="font-bold text-blue-700">快速編輯圖紙基本資訊</div>
        <input
          type="text"
          value={draft.partNo || ""}
          onChange={(e) => setDraft({ ...draft, partNo: e.target.value })}
          placeholder="料號"
          className="rounded border border-slate-300 bg-white px-2 py-1"
        />
        <div className="grid grid-cols-3 gap-1.5">
          <input
            type="text"
            value={draft.testStandard || ""}
            onChange={(e) => setDraft({ ...draft, testStandard: e.target.value })}
            placeholder="測試標準"
            className="rounded border border-slate-300 bg-white px-2 py-1"
          />
          <input
            type="text"
            value={draft.revision || ""}
            onChange={(e) => setDraft({ ...draft, revision: e.target.value })}
            placeholder="版次"
            className="rounded border border-slate-300 bg-white px-2 py-1"
          />
          <input
            type="text"
            value={draft.issueDate || ""}
            onChange={(e) => setDraft({ ...draft, issueDate: e.target.value })}
            placeholder="發行日期"
            className="rounded border border-slate-300 bg-white px-2 py-1"
          />
        </div>
        <input
          type="text"
          value={draft.partName || ""}
          onChange={(e) => setDraft({ ...draft, partName: e.target.value })}
          placeholder="產品名稱"
          className="rounded border border-slate-300 bg-white px-2 py-1"
        />
        <input
          type="text"
          value={draft.notes || ""}
          onChange={(e) => setDraft({ ...draft, notes: e.target.value })}
          placeholder="備註"
          className="rounded border border-slate-300 bg-white px-2 py-1"
        />
        <div className="mt-1 flex justify-end gap-1.5">
          <button
            type="button"
            onClick={() => setIsEditing(false)}
            className="rounded border border-slate-300 bg-white px-2.5 py-1 text-xs"
          >
            取消
          </button>
          <button
            type="button"
            disabled={isBusy}
            onClick={() => void handleSave()}
            className="rounded bg-blue-600 px-3 py-1 text-xs font-semibold text-white disabled:opacity-50"
          >
            儲存變更
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`flex flex-col gap-2 rounded-lg border p-3 transition ${
        isCurrent
          ? "border-blue-500 bg-blue-50/40"
          : "border-slate-300 bg-white hover:border-blue-400"
      }`}
    >
      <div className="flex gap-2.5">
        <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded border border-slate-200 bg-slate-50 p-1 text-center text-[11px] text-slate-400">
          {record.compositeImageFile ? (
            <img
              src={`/api/files/${encodeURIComponent(record.compositeImageFile)}`}
              alt={record.partNo}
              className="h-full w-full object-contain"
            />
          ) : (
            <span>{record.sourceFile ? "PDF\n已附圖" : "尚未\n上傳圖紙"}</span>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <span className="truncate text-sm font-extrabold text-slate-900">{record.partNo}</span>
            {isCurrent && (
              <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
                編輯中
              </span>
            )}
          </div>
          <div className="mt-0.5 font-mono text-xs text-blue-700">
            {record.page3?.combinedStandardRevDate || record.page3?.testStandard || "未填標準"}
          </div>
          <div className="mt-0.5 truncate text-xs text-slate-500">
            {record.page4?.partName || "未填產品名稱"}
          </div>
          <div className="mt-1.5 flex flex-wrap gap-1">
            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-700">
              {specCount} 項規格
            </span>
            <span
              className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                placedCount > 0 ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"
              }`}
            >
              球標 {placedCount}/{specCount}
            </span>
            <span
              className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                record.sourceFile
                  ? "bg-emerald-100 text-emerald-800"
                  : "bg-amber-100 text-amber-800"
              }`}
            >
              {record.sourceFile ? "已存 PDF" : "未附 PDF"}
            </span>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between border-t border-slate-100 pt-2">
        <span className="text-[11px] text-slate-400">更新：{formatDateTime(record.updatedAt)}</span>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={startEdit}
            className="rounded px-2 py-1 text-xs font-semibold text-blue-700 hover:bg-blue-50"
          >
            編輯
          </button>
          <button
            type="button"
            onClick={() => void onDelete()}
            className="rounded px-2 py-1 text-xs font-semibold text-red-600 hover:bg-red-50"
          >
            刪除
          </button>
          <button
            type="button"
            onClick={onLoad}
            className="rounded bg-blue-600 px-2.5 py-1 text-xs font-semibold text-white hover:bg-blue-700"
          >
            呼叫載入
          </button>
        </div>
      </div>
    </div>
  );
}
