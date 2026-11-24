"use client";

import React from "react";
import type { ToastItem } from "@/hooks/useToast";

interface ToastContainerProps {
  toasts: ToastItem[];
  onDismiss: (id: number) => void;
}

const KIND_CLASS: Record<ToastItem["kind"], string> = {
  info: "bg-slate-900 text-white",
  success: "bg-emerald-800 text-white",
  warn: "bg-amber-700 text-white",
  error: "bg-red-700 text-white",
};

export function ToastContainer({ toasts, onDismiss }: ToastContainerProps): React.ReactElement {
  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          onClick={() => onDismiss(toast.id)}
          className={`cursor-pointer rounded-lg px-4 py-2.5 text-sm font-medium shadow-lg transition ${KIND_CLASS[toast.kind]}`}
        >
          {toast.message}
        </div>
      ))}
    </div>
  );
}
