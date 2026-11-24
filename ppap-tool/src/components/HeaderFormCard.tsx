"use client";

import React, { useEffect, useState } from "react";
import type { EquipmentItem, Page3Data, Page4Data } from "@/types/ppap";
import type { RequiredFieldKey } from "@/utils/drawingValidator";
import { getCombinedStandardRevDate } from "@/utils/specFormatter";
import { HeaderAdvancedFields } from "./HeaderAdvancedFields";

interface HeaderFormCardProps {
  page3: Page3Data;
  page4: Page4Data;
  notes: string;
  equipmentLibrary: EquipmentItem[];
  invalidFields?: RequiredFieldKey[];
  onChangePage3: (patch: Partial<Page3Data>) => void;
  onChangePage4: (patch: Partial<Page4Data>) => void;
  onChangeNotes: (notes: string) => void;
  onApplyQtyToAllSpecs: (qty: number) => void;
  onOpenEquipmentManager: () => void;
}

export function HeaderFormCard({
  page3,
  page4,
  notes,
  equipmentLibrary,
  invalidFields = [],
  onChangePage3,
  onChangePage4,
  onChangeNotes,
  onApplyQtyToAllSpecs,
  onOpenEquipmentManager,
}: HeaderFormCardProps): React.ReactElement {
  const [isCollapsed, setIsCollapsed] = useState<boolean>(false);

  useEffect(() => {
    if (invalidFields.length > 0) setIsCollapsed(false);
  }, [invalidFields]);

  const isInvalid = (key: RequiredFieldKey): boolean => invalidFields.includes(key);
  const inputErrCls = (key: RequiredFieldKey): string =>
    isInvalid(key)
      ? "border-red-500 bg-red-50/40 ring-2 ring-red-500/20"
      : "border-slate-300 focus:border-blue-600 focus:ring-2 focus:ring-blue-600/15";

  const combinedStd = getCombinedStandardRevDate(
    page3.testStandard,
    page3.revision,
    page3.issueDate
  );

  return (
    <div className="rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 shadow-sm">
      <div
        onClick={() => setIsCollapsed((prev) => !prev)}
        className={`flex cursor-pointer select-none flex-wrap items-center justify-between gap-2 ${
          isCollapsed ? "" : "mb-2.5"
        }`}
      >
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="text-sm font-bold text-slate-900">1. P3 / P4 基本資訊與測試標準</h2>
          {isCollapsed && (
            <span className="rounded bg-blue-50 px-2 py-0.5 font-mono text-[11px] font-bold text-blue-800">
              {page3.itemNo || "未填料號"} · {page3.sampleQtyNumber || 5} PCS
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span className="rounded-full border border-slate-300 bg-slate-100 px-2.5 py-0.5 font-mono text-[11px] text-slate-700">
            標準/版次/日期：{combinedStd || "—"}
          </span>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setIsCollapsed((prev) => !prev);
            }}
            className="rounded border border-slate-300 bg-white px-2 py-0.5 text-[11px] font-semibold text-slate-700 hover:bg-slate-100"
          >
            {isCollapsed ? "▼ 展開" : "▲ 收合"}
          </button>
        </div>
      </div>

      {!isCollapsed && (
        <>
          <div className="grid grid-cols-2 gap-x-3 gap-y-2.5">
        <div>
          <label className="mb-1 block text-xs font-semibold text-slate-600">
            料號 (Item No / Part No.) <span className="text-red-600">*</span>
          </label>
          <input
            type="text"
            value={page3.itemNo}
            onChange={(e) => {
              onChangePage3({ itemNo: e.target.value });
              onChangePage4({ partNumber: e.target.value });
            }}
            placeholder="例如：E4010-BLUE"
            className={`w-full rounded-md border px-2.5 py-1.5 text-xs focus:outline-none ${inputErrCls("itemNo")}`}
          />
        </div>

        <div>
          <label className="mb-1 block text-xs font-semibold text-slate-600">
            樣品數 (Sample Q&apos;TY / Test Qty)
          </label>
          <div className="flex items-center gap-1.5">
            <input
              type="number"
              min={1}
              max={999}
              value={page3.sampleQtyNumber}
              onChange={(e) => {
                const qty = Math.max(1, Number(e.target.value) || 5);
                onChangePage3({ sampleQtyNumber: qty, sampleQty: `${qty} PCS` });
              }}
              className="w-16 rounded-md border border-slate-300 px-2 py-1.5 text-center text-xs focus:border-blue-600 focus:outline-none"
            />
            <span className="text-xs font-bold text-slate-500">PCS</span>
            <button
              type="button"
              onClick={() => onApplyQtyToAllSpecs(page3.sampleQtyNumber)}
              className="rounded border border-slate-300 bg-white px-2 py-1 text-[11px] font-semibold text-slate-700 hover:bg-slate-100"
            >
              套用全部
            </button>
          </div>
        </div>

        <div className="col-span-2">
          <label className="mb-1 block text-xs font-semibold text-slate-600">
            產品名稱 (P4 Part/Component name)
          </label>
          <input
            type="text"
            value={page4.partName}
            onChange={(e) => onChangePage4({ partName: e.target.value })}
            placeholder="例如：NYLON-INSULATED CORD END TERMINALS(E SERIES)"
            className="w-full rounded-md border border-slate-300 px-2.5 py-1.5 text-xs focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/15"
          />
        </div>

        <div>
          <label className="mb-1 block text-xs font-semibold text-slate-600">
            測試標準 / 圖號 (Test Standard) <span className="text-red-600">*</span>
          </label>
          <input
            type="text"
            value={page3.testStandard}
            onChange={(e) => {
              const val = e.target.value;
              onChangePage3({
                testStandard: val,
                ...(page3.judgementSyncWithTestStandard ? { judgementStandard: val } : {}),
              });
            }}
            placeholder="例如：KA-95436-C"
            className={`w-full rounded-md border px-2.5 py-1.5 text-xs focus:outline-none ${inputErrCls("testStandard")}`}
          />
        </div>

        <div className="grid grid-cols-5 gap-2">
          <div className="col-span-2">
            <label className="mb-1 block text-xs font-semibold text-slate-600">版次 (Rev.)</label>
            <input
              type="text"
              value={page3.revision}
              onChange={(e) => onChangePage3({ revision: e.target.value })}
              placeholder="1-1"
              className="w-full rounded-md border border-slate-300 px-2 py-1.5 text-xs focus:border-blue-600 focus:outline-none"
            />
          </div>
          <div className="col-span-3">
            <label className="mb-1 block text-xs font-semibold text-slate-600">
              發行日期 (Date)
            </label>
            <input
              type="text"
              value={page3.issueDate}
              onChange={(e) => onChangePage3({ issueDate: e.target.value })}
              placeholder="YYYY/MM/DD"
              className="w-full rounded-md border border-slate-300 px-2 py-1.5 text-xs focus:border-blue-600 focus:outline-none"
            />
          </div>
        </div>

        <div className="col-span-2">
          <div className="mb-1 flex items-center justify-between">
            <label className="text-xs font-semibold text-slate-600">
              判定標準 (Judgement standard)
            </label>
            <label className="flex cursor-pointer select-none items-center gap-1 text-xs text-slate-600">
              <input
                type="checkbox"
                checked={page3.judgementSyncWithTestStandard}
                onChange={(e) => {
                  const checked = e.target.checked;
                  onChangePage3({
                    judgementSyncWithTestStandard: checked,
                    ...(checked ? { judgementStandard: page3.testStandard } : {}),
                  });
                }}
              />
              <span>預設與「測試標準」相同</span>
            </label>
          </div>
          <input
            type="text"
            value={page3.judgementStandard}
            readOnly={page3.judgementSyncWithTestStandard}
            onChange={(e) => onChangePage3({ judgementStandard: e.target.value })}
            placeholder="預設自動帶入測試標準"
            className={`w-full rounded-md border border-slate-300 px-2.5 py-1.5 text-xs focus:border-blue-600 focus:outline-none ${
              page3.judgementSyncWithTestStandard ? "bg-slate-50 text-slate-500" : "bg-white"
            }`}
          />
        </div>
      </div>

          <HeaderAdvancedFields
            page3={page3}
            page4={page4}
            notes={notes}
            equipmentLibrary={equipmentLibrary}
            onChangePage3={onChangePage3}
            onChangePage4={onChangePage4}
            onChangeNotes={onChangeNotes}
            onOpenEquipmentManager={onOpenEquipmentManager}
          />
        </>
      )}
    </div>
  );
}
