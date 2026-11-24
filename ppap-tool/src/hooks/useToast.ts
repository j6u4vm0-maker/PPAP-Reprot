"use client";

import { useCallback, useState } from "react";
import type { ToastKind } from "@/types/ppap";

export interface ToastItem {
  id: number;
  message: string;
  kind: ToastKind;
}

export interface UseToastReturn {
  toasts: ToastItem[];
  showToast: (message: string, kind?: ToastKind) => void;
  dismissToast: (id: number) => void;
}

/**
 * 全域通知訊息佇列 Hook
 */
export function useToast(): UseToastReturn {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const dismissToast = useCallback((id: number): void => {
    setToasts((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const showToast = useCallback((message: string, kind: ToastKind = "info"): void => {
    const id = Date.now() + Math.floor(Math.random() * 1000);
    setToasts((prev) => [...prev, { id, message, kind }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((item) => item.id !== id));
    }, 3200);
  }, []);

  return { toasts, showToast, dismissToast };
}
