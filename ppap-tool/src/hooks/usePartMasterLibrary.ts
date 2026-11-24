"use client";

import { useCallback, useState } from "react";
import type { PartMasterInput, PartMasterItem } from "@/types/ppap";

export interface BatchImportResult {
  addedCount: number;
  updatedCount: number;
}

export interface UsePartMasterLibraryReturn {
  parts: PartMasterItem[];
  isLoading: boolean;
  error: string | null;
  fetchParts: () => Promise<PartMasterItem[]>;
  addPart: (payload: PartMasterInput) => Promise<{ item: PartMasterItem; replacedExisting: boolean }>;
  batchImportParts: (items: PartMasterInput[]) => Promise<BatchImportResult>;
  updatePart: (id: string, payload: PartMasterInput) => Promise<PartMasterItem>;
  deletePart: (id: string) => Promise<void>;
}

/**
 * 料號／品名／圖號／版次／發行日期主檔 CRUD API Hook
 */
export function usePartMasterLibrary(): UsePartMasterLibraryReturn {
  const [parts, setParts] = useState<PartMasterItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchParts = useCallback(async (): Promise<PartMasterItem[]> => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/parts");
      const data = (await res.json()) as { parts?: PartMasterItem[]; error?: string };
      if (!res.ok) throw new Error(data.error || "讀取料號主檔失敗");
      const list = data.parts || [];
      setParts(list);
      return list;
    } catch (err) {
      const msg = err instanceof Error ? err.message : "讀取料號主檔發生錯誤";
      setError(msg);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const addPart = useCallback(
    async (
      payload: PartMasterInput
    ): Promise<{ item: PartMasterItem; replacedExisting: boolean }> => {
      setError(null);
      try {
        const res = await fetch("/api/parts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const data = (await res.json()) as {
          item?: PartMasterItem;
          replacedExisting?: boolean;
          error?: string;
        };
        if (!res.ok || !data.item) throw new Error(data.error || "新增料號主檔失敗");
        await fetchParts();
        return { item: data.item, replacedExisting: Boolean(data.replacedExisting) };
      } catch (err) {
        const msg = err instanceof Error ? err.message : "新增料號主檔發生錯誤";
        setError(msg);
        throw err;
      }
    },
    [fetchParts]
  );

  const batchImportParts = useCallback(
    async (items: PartMasterInput[]): Promise<BatchImportResult> => {
      setError(null);
      try {
        const res = await fetch("/api/parts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ items }),
        });
        const data = (await res.json()) as {
          addedCount?: number;
          updatedCount?: number;
          error?: string;
        };
        if (!res.ok) throw new Error(data.error || "批次匯入料號主檔失敗");
        await fetchParts();
        return {
          addedCount: data.addedCount ?? 0,
          updatedCount: data.updatedCount ?? 0,
        };
      } catch (err) {
        const msg = err instanceof Error ? err.message : "批次匯入料號主檔發生錯誤";
        setError(msg);
        throw err;
      }
    },
    [fetchParts]
  );

  const updatePart = useCallback(
    async (id: string, payload: PartMasterInput): Promise<PartMasterItem> => {
      setError(null);
      try {
        const res = await fetch(`/api/parts/${encodeURIComponent(id)}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const data = (await res.json()) as { item?: PartMasterItem; error?: string };
        if (!res.ok || !data.item) throw new Error(data.error || "編輯料號主檔失敗");
        await fetchParts();
        return data.item;
      } catch (err) {
        const msg = err instanceof Error ? err.message : "編輯料號主檔發生錯誤";
        setError(msg);
        throw err;
      }
    },
    [fetchParts]
  );

  const deletePart = useCallback(
    async (id: string): Promise<void> => {
      setError(null);
      try {
        const res = await fetch(`/api/parts/${encodeURIComponent(id)}`, {
          method: "DELETE",
        });
        const data = (await res.json()) as { error?: string };
        if (!res.ok) throw new Error(data.error || "刪除料號主檔失敗");
        await fetchParts();
      } catch (err) {
        const msg = err instanceof Error ? err.message : "刪除料號主檔發生錯誤";
        setError(msg);
        throw err;
      }
    },
    [fetchParts]
  );

  return {
    parts,
    isLoading,
    error,
    fetchParts,
    addPart,
    batchImportParts,
    updatePart,
    deletePart,
  };
}
