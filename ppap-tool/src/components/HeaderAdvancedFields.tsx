"use client";

import React from "react";
import type { EquipmentItem, Page3Data, Page4Data } from "@/types/ppap";
import { ReportEquipmentEditor } from "./ReportEquipmentEditor";

interface HeaderAdvancedFieldsProps {
  page3: Page3Data;
  page4: Page4Data;
  notes: string;
  equipmentLibrary: EquipmentItem[];
  onChangePage3: (patch: Partial<Page3Data>) => void;
  onChangePage4: (patch: Partial<Page4Data>) => void;
  onChangeNotes: (notes: string) => void;
  onOpenEquipmentManager: () => void;
}

/**
 * 表頭進階欄位（測試項目、試驗條件、測試儀器 CRUD、P4 設變紀錄與備註）
 */
export function HeaderAdvancedFields({
  page3,
  page4,
  notes,
  equipmentLibrary,
  onChangePage3,
  onChangePage4,
  onChangeNotes,
  onOpenEquipmentManager,
}: HeaderAdvancedFieldsProps): React.ReactElement {
  return (
    <details className="mt-2.5 border-t border-dashed border-slate-200 pt-2">
      <summary className="cursor-pointer select-none text-xs font-semibold text-blue-700">
        展開進階欄位（測試項目、試驗條件、測試儀器 CRUD、P4 設變紀錄與備註）
      </summary>

      <div className="mt-2.5 grid grid-cols-2 gap-2.5">
        <div>
          <label className="mb-1 block text-xs font-semibold text-slate-600">測試項目</label>
          <input
            type="text"
            value={page3.testItems}
            onChange={(e) => onChangePage3({ testItems: e.target.value })}
            className="w-full rounded-md border border-slate-300 px-2 py-1 text-xs"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold text-slate-600">試驗條件</label>
          <input
            type="text"
            value={page3.testConditions}
            onChange={(e) => onChangePage3({ testConditions: e.target.value })}
            className="w-full rounded-md border border-slate-300 px-2 py-1 text-xs"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold text-slate-600">
            P4 Level record of design change
          </label>
          <input
            type="text"
            value={page4.levelRecordOfDesignChange}
            onChange={(e) => onChangePage4({ levelRecordOfDesignChange: e.target.value })}
            className="w-full rounded-md border border-slate-300 px-2 py-1 text-xs"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold text-slate-600">
            P4 Document of engineering change
          </label>
          <input
            type="text"
            value={page4.documentOfEngineeringChange}
            onChange={(e) => onChangePage4({ documentOfEngineeringChange: e.target.value })}
            className="w-full rounded-md border border-slate-300 px-2 py-1 text-xs"
          />
        </div>

        <ReportEquipmentEditor
          equipment={page3.testEquipment}
          equipmentLibrary={equipmentLibrary}
          onChangeEquipment={(next) => onChangePage3({ testEquipment: next })}
          onOpenLibraryManager={onOpenEquipmentManager}
        />

        <div className="col-span-2">
          <label className="mb-1 block text-xs font-semibold text-slate-600">圖紙備註</label>
          <input
            type="text"
            value={notes}
            onChange={(e) => onChangeNotes(e.target.value)}
            placeholder="選填：圖紙版本說明或注意事項"
            className="w-full rounded-md border border-slate-300 px-2 py-1 text-xs"
          />
        </div>
      </div>
    </details>
  );
}
