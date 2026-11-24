"use client";

import React from "react";
import type { TransferJsonPage3 } from "@/types/ppap";

interface ReportP3SheetProps {
  page3: TransferJsonPage3;
}

/**
 * A4 直式（210×297 比例）PAGE 3 尺寸量測報告預覽頁
 */
export function ReportP3Sheet({ page3 }: ReportP3SheetProps): React.ReactElement {
  return (
    <div className="mx-auto flex aspect-[210/297] w-full max-w-[540px] flex-col rounded border border-slate-300 bg-white p-6 text-black shadow-md">
      {/* A4 Portrait Top Header */}
      <div className="mb-3 flex items-center justify-center gap-3 border-b border-slate-200 pb-2">
        <span className="font-black text-2xl tracking-tight text-slate-600">KST</span>
        <div className="text-center leading-tight">
          <div className="text-base font-bold tracking-widest text-slate-600">試 驗 報 告</div>
          <div className="text-sm font-bold text-slate-500">Test Report</div>
        </div>
      </div>

      <div className="mb-1.5 flex items-center justify-between text-[11px] text-slate-600">
        <span>報告編號(Report No)：（待實驗室填寫）</span>
        <span className="rounded bg-slate-800 px-1.5 py-0.5 text-[10px] font-bold text-white">
          PAGE 3 · A4 直式
        </span>
      </div>

      {/* P3 Header Table */}
      <table className="w-full border-collapse text-[11px] text-black">
        <tbody>
          <tr>
            <td className="w-[34%] border border-black px-2 py-1 font-medium">
              測試項目(Test Items)
            </td>
            <td colSpan={3} className="border border-black px-2 py-1">
              {page3.testItems || "—"}
            </td>
          </tr>
          <tr>
            <td className="border border-black px-2 py-1 font-medium">測試品名(Item No)</td>
            <td className="w-[26%] border border-black px-2 py-1 font-semibold">
              {page3.itemNo || "—"}
            </td>
            <td className="w-[24%] border border-black px-2 py-1 font-medium">
              樣品數(Sample Q&apos;TY)
            </td>
            <td className="w-[16%] border border-black px-2 py-1 text-center">
              {page3.sampleQty || "5 PCS"}
            </td>
          </tr>
          <tr>
            <td className="border border-black px-2 py-1 font-medium leading-tight">
              測試標準/版次/發行日期
              <br />
              (Test standards/ Rev./ Date)
            </td>
            <td colSpan={3} className="border border-black px-2 py-1 font-mono">
              {page3.combinedStandardRevDate || "—"}
            </td>
          </tr>
          <tr>
            <td className="border border-black px-2 py-1 font-medium">
              試驗條件(Test Conditions)
            </td>
            <td colSpan={3} className="border border-black px-2 py-1">
              {page3.testConditions || "無"}
            </td>
          </tr>
          <tr>
            <td className="border border-black px-2 py-1 font-medium">
              判定標準(Judgement standard)
            </td>
            <td colSpan={3} className="border border-black px-2 py-1 font-mono">
              {page3.judgementStandard || "—"}
            </td>
          </tr>
          <tr>
            <td className="border border-black px-2 py-1 font-medium">
              測試儀器(Test Equipment)
            </td>
            <td colSpan={3} className="whitespace-pre-line border border-black px-2 py-1 leading-snug">
              {page3.testEquipment.length > 0 ? page3.testEquipment.join("\n") : "—"}
            </td>
          </tr>
        </tbody>
      </table>

      {/* Engineering Drawing Area inside A4 Portrait */}
      <div className="mt-3 flex flex-1 items-center justify-center overflow-hidden border border-slate-300 bg-white p-2">
        {page3.balloonedDrawingImageBase64 ? (
          <img
            src={page3.balloonedDrawingImageBase64}
            alt="P3 球標工程圖預覽"
            className="max-h-full max-w-full object-contain"
          />
        ) : (
          <span className="text-xs text-slate-400">
            尚未匯入工程圖紙（匯入 PDF 後此處自動顯示合成球標圖面）
          </span>
        )}
      </div>

      <div className="mt-2 flex justify-between border-t border-slate-200 pt-1 text-[9.5px] text-slate-400">
        <span>K.S. TERMINALS INC.</span>
        <span>Page 3 (Portrait A4)</span>
      </div>
    </div>
  );
}
