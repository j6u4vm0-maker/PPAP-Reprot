"use client";

import React from "react";
import type { Page4Data } from "@/types/ppap";

interface ReportP4SheetProps {
  page4: Page4Data;
}

/**
 * A4 直式（210×297 比例）PAGE 4 PPAP Dimension Measurement Report 預覽頁
 */
export function ReportP4Sheet({ page4 }: ReportP4SheetProps): React.ReactElement {
  const totalRows = Math.max(15, page4.specifications.length);

  return (
    <div className="mx-auto flex aspect-[210/297] w-full max-w-[540px] flex-col rounded border border-slate-300 bg-white p-6 text-black shadow-md">
      {/* A4 Portrait Top Header */}
      <div className="mb-2 flex items-center justify-center gap-3 border-b border-slate-200 pb-1.5">
        <span className="font-black text-2xl tracking-tight text-slate-600">KST</span>
        <div className="text-center leading-tight">
          <div className="text-base font-bold tracking-widest text-slate-600">試 驗 報 告</div>
          <div className="text-sm font-bold text-slate-500">Test Report</div>
        </div>
      </div>

      <div className="mb-1 flex items-center justify-between text-[11px]">
        <span className="font-medium text-black">測試結果(Test Result)</span>
        <span className="rounded bg-slate-800 px-1.5 py-0.5 text-[10px] font-bold text-white">
          PAGE 4 · A4 直式
        </span>
      </div>

      {/* Main PPAP Portrait Frame */}
      <div className="flex flex-1 flex-col border-[1.5px] border-black">
        <div className="flex items-center gap-2.5 border-b border-black px-3 py-1.5">
          <span className="font-black text-lg tracking-tight text-black">KST</span>
          <span className="text-sm font-semibold text-black">
            PPAP Dimension Measurement Report
          </span>
        </div>

        <table className="w-full border-collapse text-[10.5px] text-black">
          <tbody>
            <tr>
              <td className="w-[46%] border-r border-black p-0 align-top">
                <div className="border-b border-black px-2 py-1">
                  Organization/Supplier No.: {page4.organization}
                </div>
                <div className="px-2 py-1">Inspection division: {page4.inspectionDivision}</div>
              </td>
              <td className="w-[54%] px-2 py-1 align-top leading-snug">
                <div>
                  Part/Component No.: &nbsp; <b>{page4.partNumber || "—"}</b>
                </div>
                <div>
                  Part/Component name:
                  <br />
                  <b className="text-[10px]">{page4.partName || "—"}</b>
                </div>
                <div>Level record of design change: &nbsp; {page4.levelRecordOfDesignChange}</div>
                <div>
                  Document of engineering change: &nbsp; {page4.documentOfEngineeringChange}
                </div>
              </td>
            </tr>
          </tbody>
        </table>

        <table className="w-full flex-1 border-collapse border-t border-black text-center text-[10px] text-black">
          <thead>
            <tr className="leading-tight">
              <th className="w-[7%] border border-black py-1">Item.</th>
              <th className="w-[15%] border border-black py-1">
                Dimension/
                <br />
                Specification
              </th>
              <th colSpan={2} className="w-[22%] border border-black py-1">
                Specification/
                <br />
                Tolerance [+/-]
              </th>
              <th className="w-[8%] border border-black py-1">Cavity</th>
              <th className="w-[10%] border border-black py-1">
                Test
                <br />
                Quantity
              </th>
              <th className="w-[26%] border border-black bg-slate-50 py-1 text-slate-400">
                Measurement Result
                <br />
                (Data)
              </th>
              <th className="w-[6%] border border-black bg-slate-50 py-1 text-slate-400">OK</th>
              <th className="w-[6%] border border-black bg-slate-50 py-1 text-slate-400">
                NOT
                <br />
                OK
              </th>
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: totalRows }).map((_, idx) => {
              const spec = page4.specifications[idx];
              return (
                <tr key={idx}>
                  <td className="border border-black py-0.5">{spec ? spec.item : "\u00A0"}</td>
                  <td className="border border-black py-0.5 font-mono">
                    {spec ? spec.dimension : ""}
                  </td>
                  <td className="w-[11%] border border-black py-0.5 font-mono">
                    {spec ? spec.tolerancePlus : ""}
                  </td>
                  <td className="w-[11%] border border-black py-0.5 font-mono">
                    {spec ? spec.toleranceMinus : ""}
                  </td>
                  <td className="border border-black py-0.5">{spec ? spec.cavity : ""}</td>
                  <td className="border border-black py-0.5">{spec ? spec.testQuantity : ""}</td>
                  <td className="border border-black py-0.5" />
                  <td className="border border-black py-0.5" />
                  <td className="border border-black py-0.5" />
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Bottom Signature Box (Portrait Footer) */}
      <div className="mt-2 flex justify-end">
        <div className="flex gap-5 border border-black px-3 py-1 text-[10.5px]">
          <span>Signature: ________</span>
          <span>Title: {page4.inspectionDivision || "QC"}</span>
          <span>Date: ____/__/__</span>
        </div>
      </div>
    </div>
  );
}
