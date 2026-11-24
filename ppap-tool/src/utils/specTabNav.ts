import type React from "react";
import type { SpecItem } from "@/types/ppap";
import { getUnilateralType, isReferenceDimension } from "./specFormatter";

export type SpecTabColumn = "dimension" | "tolerancePlus" | "toleranceMinus";

export interface SpecTabTarget {
  row: number;
  col: SpecTabColumn;
}

/**
 * 判斷該規格列是否不需填寫公差（MAX / MIN 單邊或參考尺寸）
 */
export function isToleranceSkippedRow(spec: Pick<SpecItem, "dimension">): boolean {
  const dim = String(spec.dimension ?? "").trim();
  if (!dim) return false;
  return isReferenceDimension(dim) || getUnilateralType(dim) !== null;
}

/**
 * 計算規格表紅框三欄（Dimension → +Tol → -Tol）按 Tab / Shift+Tab 的下一個聚焦格子
 * - 絕不往右跳出至 Cavity / Qty / 操作欄
 * - 遇到 MAX / MIN / 參考尺寸列自動跳過 +Tol / -Tol
 * - 到達最後一列最後一格或第一列第一格時回傳 null（停在原地，不自動新增列）
 */
export function getNextSpecTabTarget(
  specs: Array<Pick<SpecItem, "dimension">>,
  currentRow: number,
  currentCol: SpecTabColumn,
  reverse: boolean
): SpecTabTarget | null {
  const totalRows = specs.length;
  if (totalRows === 0 || currentRow < 0 || currentRow >= totalRows) return null;

  const currentSkipped = isToleranceSkippedRow(specs[currentRow]);

  if (!reverse) {
    if (currentCol === "dimension") {
      if (!currentSkipped) return { row: currentRow, col: "tolerancePlus" };
      return currentRow + 1 < totalRows ? { row: currentRow + 1, col: "dimension" } : null;
    }
    if (currentCol === "tolerancePlus") {
      return { row: currentRow, col: "toleranceMinus" };
    }
    return currentRow + 1 < totalRows ? { row: currentRow + 1, col: "dimension" } : null;
  }

  // Shift + Tab 反向導覽
  if (currentCol === "toleranceMinus") {
    return { row: currentRow, col: "tolerancePlus" };
  }
  if (currentCol === "tolerancePlus") {
    return { row: currentRow, col: "dimension" };
  }
  if (currentRow - 1 < 0) return null;
  const prevSkipped = isToleranceSkippedRow(specs[currentRow - 1]);
  return { row: currentRow - 1, col: prevSkipped ? "dimension" : "toleranceMinus" };
}

/**
 * 依據目標座標將鍵盤焦點移至對應的規格輸入框並全選內容
 */
export function focusSpecCell(
  container: HTMLElement | null,
  target: SpecTabTarget
): boolean {
  if (!container) return false;
  const selector = `input[data-spec-row="${target.row}"][data-spec-col="${target.col}"]`;
  const inputEl = container.querySelector<HTMLInputElement>(selector);
  if (!inputEl) return false;
  inputEl.focus();
  inputEl.select();
  return true;
}

/**
 * 處理規格表三格（Dimension / +Tol / -Tol）的 Tab / Shift+Tab 鍵盤事件
 */
export function handleSpecTabKeyDown(
  e: React.KeyboardEvent<HTMLInputElement>,
  specs: Array<Pick<SpecItem, "dimension">>,
  row: number,
  col: SpecTabColumn,
  onSelectRow: (index: number) => void
): void {
  if (e.key !== "Tab") return;
  e.preventDefault();
  const target = getNextSpecTabTarget(specs, row, col, e.shiftKey);
  if (!target) return;
  const tbody = e.currentTarget.closest("tbody");
  if (focusSpecCell(tbody, target)) {
    onSelectRow(target.row);
  }
}
