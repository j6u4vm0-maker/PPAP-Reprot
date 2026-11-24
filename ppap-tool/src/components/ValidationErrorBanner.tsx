"use client";

import React from "react";
import type { DrawingValidationResult } from "@/utils/drawingValidator";

interface ValidationErrorBannerProps {
  validation: DrawingValidationResult | null;
  onDismiss: () => void;
}

export function ValidationErrorBanner({
  validation,
  onDismiss,
}: ValidationErrorBannerProps): React.ReactElement | null {
  if (!validation || validation.valid || validation.missingMessages.length === 0) {
    return null;
  }

  return (
    <div className="rounded-lg border border-red-300 bg-red-50 px-3.5 py-2.5 text-xs text-red-800 shadow-sm">
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="font-bold text-red-900">
            ⚠️ 尚未填寫完整，請先補齊以下紅框欄位後再存檔：
          </div>
          <ul className="mt-1 list-disc space-y-0.5 pl-4">
            {validation.missingMessages.map((msg, i) => (
              <li key={i}>{msg}</li>
            ))}
          </ul>
        </div>
        <button
          type="button"
          onClick={onDismiss}
          className="rounded px-1.5 py-0.5 text-red-600 hover:bg-red-100"
          title="關閉提醒"
        >
          ✕
        </button>
      </div>
    </div>
  );
}
