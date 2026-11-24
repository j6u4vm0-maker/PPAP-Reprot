"use client";

import React, { useMemo, useState } from "react";
import type { PartMasterInput, PartMasterItem } from "@/types/ppap";
import type { BatchImportResult } from "@/hooks/usePartMasterLibrary";
import { parsePastedPartMasters } from "@/utils/partMasterParser";
import { PartMasterRow } from "./PartMasterRow";

interface PartMasterModalProps {
  isOpen: boolean;
  parts: PartMasterItem[];
  onClose: () => void;
  onApplyPart: (item: PartMasterItem) => void;
  onAdd: (payload: PartMasterInput) => Promise<void>;
  onBatchImport: (items: PartMasterInput[]) => Promise<BatchImportResult>;
  onUpdate: (id: string, payload: PartMasterInput) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

const EMPTY_FORM: PartMasterInput = {
  partNo: "",
  partName: "",
  testStandard: "",
  revision: "",
  issueDate: "",
};

export function PartMasterModal({
  isOpen,
  parts,
  onClose,
  onApplyPart,
  onAdd,
  onBatchImport,
  onUpdate,
  onDelete,
}: PartMasterModalProps): React.ReactElement | null {
  const [tab, setTab] = useState<"single" | "batch">("single");
  const [search, setSearch] = useState<string>("");
  const [form, setForm] = useState<PartMasterInput>(EMPTY_FORM);
  const [batchText, setBatchText] = useState<string>("");
  const [submitting, setSubmitting] = useState<boolean>(false);

  const filteredParts = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return parts;
    return parts.filter((p) =>
      [p.partNo, p.partName, p.testStandard, p.revision, p.issueDate]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(q)
    );
  }, [parts, search]);

  const parsedBatch = useMemo(() => parsePastedPartMasters(batchText), [batchText]);

  if (!isOpen) return null;

  const handleAddSingle = async (): Promise<void> => {
    if (!form.partNo.trim() && !form.testStandard.trim()) return;
    setSubmitting(true);
    try {
      await onAdd(form);
      setForm(EMPTY_FORM);
    } finally {
      setSubmitting(false);
    }
  };

  const handleBatchSubmit = async (): Promise<void> => {
    if (parsedBatch.length === 0) return;
    setSubmitting(true);
    try {
      await onBatchImport(parsedBatch);
      setBatchText("");
      setTab("single");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/55 p-4"
    >
      <div className="flex max-h-[88vh] w-full max-w-4xl flex-col overflow-hidden rounded-xl bg-white shadow-2xl">
        <div className="flex items-start justify-between border-b border-slate-200 px-5 py-3">
          <div>
            <h3 className="text-base font-bold text-slate-900">
              🗂️ 料號／品名／圖號／版次主檔管理
            </h3>
            <p className="text-xs text-slate-500">
              支援單筆新增／編輯／刪除與 Excel 批次貼上，點選「帶入」即可自動填入表單
            </p>
          </div>
          <button type="button" onClick={onClose} className="rounded p-1 text-slate-500 hover:bg-slate-100">
            ✕
          </button>
        </div>

        <div className="border-b border-slate-200 bg-slate-50 px-5 py-2.5">
          <div className="mb-2 flex items-center gap-2">
            {(["single", "batch"] as const).map((key) => (
              <button
                key={key}
                type="button"
                onClick={() => setTab(key)}
                className={`rounded-md px-2.5 py-1 text-xs font-semibold ${
                  tab === key
                    ? "bg-blue-600 text-white"
                    : "border border-slate-300 bg-white text-slate-600 hover:bg-slate-100"
                }`}
              >
                {key === "single" ? "＋ 單筆新增" : "📋 Excel / 文字批次貼上"}
              </button>
            ))}
          </div>

          {tab === "single" ? (
            <div className="grid grid-cols-12 gap-2">
              <input
                type="text"
                value={form.partNo}
                onChange={(e) => setForm((p) => ({ ...p, partNo: e.target.value }))}
                placeholder="料號 (例: PNT14)"
                className="col-span-2 rounded border border-slate-300 bg-white px-2 py-1.5 font-mono text-xs"
              />
              <input
                type="text"
                value={form.partName}
                onChange={(e) => setForm((p) => ({ ...p, partName: e.target.value }))}
                placeholder="產品名稱 / 品名"
                className="col-span-3 rounded border border-slate-300 bg-white px-2 py-1.5 text-xs"
              />
              <input
                type="text"
                value={form.testStandard}
                onChange={(e) => setForm((p) => ({ ...p, testStandard: e.target.value }))}
                placeholder="圖號 (例: KT-95721-C)"
                className="col-span-3 rounded border border-slate-300 bg-white px-2 py-1.5 font-mono text-xs"
              />
              <input
                type="text"
                value={form.revision}
                onChange={(e) => setForm((p) => ({ ...p, revision: e.target.value }))}
                placeholder="版次 (1-1)"
                className="col-span-1 rounded border border-slate-300 bg-white px-2 py-1.5 text-center font-mono text-xs"
              />
              <input
                type="text"
                value={form.issueDate}
                onChange={(e) => setForm((p) => ({ ...p, issueDate: e.target.value }))}
                placeholder="日期 2019/11/08"
                className="col-span-2 rounded border border-slate-300 bg-white px-2 py-1.5 font-mono text-xs"
              />
              <button
                type="button"
                disabled={submitting || (!form.partNo.trim() && !form.testStandard.trim())}
                onClick={() => void handleAddSingle()}
                className="col-span-1 rounded bg-blue-600 px-2 py-1.5 text-xs font-semibold text-white hover:bg-blue-700 disabled:opacity-40"
              >
                新增
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              <textarea
                rows={4}
                value={batchText}
                onChange={(e) => setBatchText(e.target.value)}
                placeholder={
                  "從 Excel 直接複製貼上（Tab 或逗號分隔），支援 3~5 欄：\n" +
                  "料號\t品名\t圖號\t版次\t發行日期\n" +
                  "PNT14\tNON-INSULATED PARALLEL CONNECTORS\tKT-95721-C\t1-1\t2019/11/08"
                }
                className="w-full rounded border border-slate-300 bg-white p-2 font-mono text-xs focus:border-blue-600 focus:outline-none"
              />
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-600">
                  {parsedBatch.length > 0
                    ? `✅ 已解析 ${parsedBatch.length} 筆有效主檔（重複料號＋圖號＋版次將自動更新）`
                    : "請貼上至少含「料號、圖號」的表格列"}
                </span>
                <button
                  type="button"
                  disabled={submitting || parsedBatch.length === 0}
                  onClick={() => void handleBatchSubmit()}
                  className="rounded bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-700 disabled:opacity-40"
                >
                  批次匯入 ({parsedBatch.length})
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-2">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="🔍 搜尋料號、品名、圖號或版次..."
            className="w-72 rounded-md border border-slate-300 px-2.5 py-1 text-xs focus:border-blue-600 focus:outline-none"
          />
          <span className="text-xs text-slate-500">
            共 {filteredParts.length} / {parts.length} 筆主檔資料
          </span>
        </div>

        <div className="flex-1 overflow-auto px-5 py-2">
          <table className="w-full border-collapse text-left text-xs">
            <thead>
              <tr className="sticky top-0 border-b border-slate-300 bg-slate-100 text-slate-700">
                <th className="w-28 p-2 font-bold">料號</th>
                <th className="p-2 font-bold">產品名稱 (品名)</th>
                <th className="w-36 p-2 font-bold">測試標準 / 圖號</th>
                <th className="w-16 p-2 text-center font-bold">版次</th>
                <th className="w-28 p-2 text-center font-bold">發行日期</th>
                <th className="w-40 p-2 text-center font-bold">操作</th>
              </tr>
            </thead>
            <tbody>
              {filteredParts.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">
                    尚無符合條件的料號主檔資料
                  </td>
                </tr>
              ) : (
                filteredParts.map((item) => (
                  <PartMasterRow
                    key={item.id}
                    item={item}
                    onApply={(selected) => {
                      onApplyPart(selected);
                      onClose();
                    }}
                    onUpdate={onUpdate}
                    onDelete={onDelete}
                  />
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
