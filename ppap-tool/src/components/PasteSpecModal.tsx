"use client";

import React, { useMemo, useState } from "react";
import type { ParsedSpecRow } from "@/types/ppap";
import { parsePastedSpecs } from "@/utils/pasteParser";
import { computeLimits, formatBalloonLabel, formatLimitDisplay } from "@/utils/specFormatter";

interface PasteSpecModalProps {
  isOpen: boolean;
  defaultQty: number;
  padZero: boolean;
  onClose: () => void;
  onApply: (rows: ParsedSpecRow[], replaceMode: boolean) => void;
  onNotify: (msg: string, kind?: "info" | "success" | "warn" | "error") => void;
}

const SAMPLE_WORD_PASTE = [
  "1\t3.20\t+0.10\t-0.10\t1\t5\t3.22, 3.22, 3.22, 3.22, 3.23\tX",
  "2\t2.80\t+0.20\t-0.20\t1\t5\t2.60GO,3.00NOGO\tX",
  "3\t17.40\t+1.10\t-1.10\t1\t5\t17.33,17.30,17.29,17.28,17.30\tX",
  "4\t10.00\t+0.40\t-0.40\t1\t5\t9.92,9.87,9.90,9.90,9.90\tX",
  "5\t7.40\t+0.50\t-0.50\t1\t5\t7.38,7.36,7.36,7.34,7.38\tX",
  "6\t4.80\t+0.40\t-0.40\t1\t5\t4.66,4.64,4.63,4.64,4.67\tX",
].join("\n");

export function PasteSpecModal({
  isOpen,
  defaultQty,
  padZero,
  onClose,
  onApply,
  onNotify,
}: PasteSpecModalProps): React.ReactElement | null {
  const [rawText, setRawText] = useState<string>("");

  const parsedRows = useMemo(
    () => parsePastedSpecs(rawText, defaultQty),
    [rawText, defaultQty]
  );

  if (!isOpen) return null;

  const handleReadClipboard = async (): Promise<void> => {
    try {
      const text = await navigator.clipboard.readText();
      if (!text) {
        onNotify("剪貼簿目前沒有文字內容", "warn");
        return;
      }
      setRawText(text);
      const count = parsePastedSpecs(text, defaultQty).length;
      if (count > 0) {
        onNotify(`已從剪貼簿讀取並解析 ${count} 項規格值！`, "success");
      } else {
        onNotify("已貼上文字，請確認內容包含尺寸與公差", "warn");
      }
    } catch {
      onNotify("瀏覽器未授權自動讀取剪貼簿，請直接在下方文字框按 Ctrl+V 貼上", "warn");
    }
  };

  const handleApply = (replaceMode: boolean): void => {
    if (parsedRows.length === 0) {
      onNotify("尚未解析到有效規格列，請先貼上資料", "warn");
      return;
    }
    onApply(parsedRows, replaceMode);
    setRawText("");
    onClose();
  };

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/55 p-4"
    >
      <div className="flex max-h-[88vh] w-full max-w-2xl flex-col overflow-hidden rounded-xl bg-white shadow-2xl">
        <div className="flex items-start justify-between border-b border-slate-200 px-5 py-3.5">
          <div>
            <h3 className="text-base font-bold text-slate-900">
              📋 一鍵貼上既有規格值（支援 Word P4 表格 / Excel）
            </h3>
            <p className="text-xs text-slate-500">
              在舊 Word 報告或 Excel 框選規格列並按 Ctrl+C 後貼入下方，系統自動過濾實測值與 OK 符號
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

        <div className="flex-1 overflow-y-auto px-5 py-3.5">
          <div className="mb-2 flex items-center gap-2">
            <button
              type="button"
              onClick={() => void handleReadClipboard()}
              className="rounded-md bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-700"
            >
              📋 直接從剪貼簿一鍵貼上
            </button>
            <button
              type="button"
              onClick={() => setRawText(SAMPLE_WORD_PASTE)}
              className="rounded px-2 py-1 text-xs text-slate-600 hover:bg-slate-100"
            >
              填入測試範例
            </button>
            <button
              type="button"
              onClick={() => setRawText("")}
              className="rounded px-2 py-1 text-xs text-slate-600 hover:bg-slate-100"
            >
              清空
            </button>
          </div>

          <textarea
            rows={6}
            value={rawText}
            onChange={(e) => setRawText(e.target.value)}
            placeholder="在此按 Ctrl+V 貼上從 Word 報告 P4 表格或 Excel 複製的規格列..."
            className="w-full rounded-md border border-slate-300 p-2.5 font-mono text-xs leading-relaxed focus:border-blue-600 focus:outline-none"
          />

          <div className="mt-3">
            <div className="mb-1.5 flex items-center justify-between">
              <strong className="text-xs text-slate-800">即時解析預覽</strong>
              <span className="rounded-full bg-blue-50 px-2.5 py-0.5 text-[11px] font-semibold text-blue-700">
                {parsedRows.length > 0
                  ? `✅ 成功解析 ${parsedRows.length} 項規格值`
                  : "尚未解析到有效規格列"}
              </span>
            </div>

            <div className="max-h-48 overflow-auto rounded-md border border-slate-200">
              <table className="w-full border-collapse text-center text-xs">
                <thead>
                  <tr className="sticky top-0 border-b border-slate-300 bg-slate-100 text-slate-700">
                    <th className="py-1">項次</th>
                    <th className="py-1">Dimension</th>
                    <th className="py-1">+Tol</th>
                    <th className="py-1">-Tol</th>
                    <th className="py-1">允收範圍</th>
                    <th className="py-1">Cavity</th>
                    <th className="py-1">Qty</th>
                  </tr>
                </thead>
                <tbody>
                  {parsedRows.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-4 text-slate-400">
                        請貼入包含尺寸與正負公差的表格內容
                      </td>
                    </tr>
                  ) : (
                    parsedRows.map((row, idx) => {
                      const lim = computeLimits(
                        row.dimension,
                        row.tolerancePlus,
                        row.toleranceMinus
                      );
                      return (
                        <tr key={idx} className="border-b border-slate-100">
                          <td className="py-1 font-bold">
                            {formatBalloonLabel(idx + 1, padZero)}
                          </td>
                          <td className="py-1 font-mono">{row.dimension}</td>
                          <td className="py-1 font-mono font-semibold text-teal-700">
                            {row.tolerancePlus}
                          </td>
                          <td className="py-1 font-mono font-semibold text-red-700">
                            {row.toleranceMinus}
                          </td>
                          <td className="py-1 font-mono text-slate-600">
                            {formatLimitDisplay(lim)}
                          </td>
                          <td className="py-1">{row.cavity}</td>
                          <td className="py-1">{row.testQuantity}</td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2 border-t border-slate-200 bg-slate-50 px-5 py-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-md border border-slate-300 bg-white px-3.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100"
          >
            取消
          </button>
          <button
            type="button"
            onClick={() => handleApply(false)}
            className="rounded-md bg-slate-700 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-slate-600"
          >
            附加至現有規格表
          </button>
          <button
            type="button"
            onClick={() => handleApply(true)}
            className="rounded-md bg-blue-600 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-blue-700"
          >
            取代現有規格表（保留球標位置）
          </button>
        </div>
      </div>
    </div>
  );
}
