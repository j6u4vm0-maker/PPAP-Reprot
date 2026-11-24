"use client";

import { useCallback, useEffect } from "react";
import type { ToastKind } from "@/types/ppap";
import {
  extractImageFileFromClipboardEvent,
  readImageFileFromNavigatorClipboard,
} from "@/utils/clipboardImage";

interface UseClipboardImagePasteParams {
  hasMedia: boolean;
  disabled: boolean;
  onPasteImage: (file: File) => void;
  showToast: (msg: string, kind?: ToastKind) => void;
}

/**
 * 監聽全域 Ctrl+V 截圖貼上與「貼上截圖」按鈕，若已有底圖則先確認避免誤蓋
 */
export function useClipboardImagePaste({
  hasMedia,
  disabled,
  onPasteImage,
  showToast,
}: UseClipboardImagePasteParams): { pasteFromButton: () => Promise<void> } {
  const applyImageWithGuard = useCallback(
    (file: File): void => {
      if (
        hasMedia &&
        !confirm("目前左側已有工程圖底圖，確定要用剪貼簿截圖取代嗎？（既有球標規格會保留）")
      ) {
        return;
      }
      onPasteImage(file);
    },
    [hasMedia, onPasteImage]
  );

  useEffect(() => {
    if (disabled) return;
    const handlePaste = (e: ClipboardEvent): void => {
      const imageFile = extractImageFileFromClipboardEvent(e);
      if (!imageFile) return;
      e.preventDefault();
      applyImageWithGuard(imageFile);
    };
    window.addEventListener("paste", handlePaste);
    return () => window.removeEventListener("paste", handlePaste);
  }, [applyImageWithGuard, disabled]);

  const pasteFromButton = useCallback(async (): Promise<void> => {
    try {
      const file = await readImageFileFromNavigatorClipboard();
      if (!file) {
        showToast("剪貼簿目前沒有圖片，請先截圖（如 Win+Shift+S）再貼上", "warn");
        return;
      }
      applyImageWithGuard(file);
    } catch (err) {
      const msg =
        err instanceof Error && err.message.includes("Ctrl+V")
          ? err.message
          : "瀏覽器未授權讀取剪貼簿，請直接按 Ctrl+V 貼上截圖";
      showToast(msg, "warn");
    }
  }, [applyImageWithGuard, showToast]);

  return { pasteFromButton };
}
