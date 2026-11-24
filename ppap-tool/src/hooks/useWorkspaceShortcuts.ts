"use client";

import { useEffect } from "react";

interface UseWorkspaceShortcutsParams {
  selectedRowIndex: number | null;
  onEscape: () => void;
  onSave: () => void;
  onDeleteSelected: (idx: number) => void;
}

/**
 * 監聽工作區全域快捷鍵：Esc 關閉視窗/取消定位、Ctrl+S 存檔、Delete 刪除所選球標與項次
 */
export function useWorkspaceShortcuts({
  selectedRowIndex,
  onEscape,
  onSave,
  onDeleteSelected,
}: UseWorkspaceShortcutsParams): void {
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent): void => {
      if (e.key === "Escape") {
        onEscape();
        return;
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s") {
        e.preventDefault();
        onSave();
        return;
      }
      if ((e.key === "Delete" || e.key === "Backspace") && selectedRowIndex !== null) {
        const tag = (document.activeElement?.tagName || "").toLowerCase();
        if (tag === "input" || tag === "textarea" || tag === "select") return;
        e.preventDefault();
        onDeleteSelected(selectedRowIndex);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onDeleteSelected, onEscape, onSave, selectedRowIndex]);
}
