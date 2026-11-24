"use client";

import { useCallback, useState } from "react";
import type { SymbolInsertMode, SymbolItem } from "@/types/ppap";

export interface UseSymbolLibraryReturn {
  symbols: SymbolItem[];
  isLoading: boolean;
  error: string | null;
  fetchSymbols: () => Promise<SymbolItem[]>;
  addSymbol: (payload: {
    label: string;
    value: string;
    mode: SymbolInsertMode;
  }) => Promise<SymbolItem>;
  updateSymbol: (
    id: string,
    payload: { label: string; value: string; mode: SymbolInsertMode }
  ) => Promise<SymbolItem>;
  deleteSymbol: (id: string) => Promise<void>;
}

/**
 * 快速符號庫 CRUD（新增、編輯、刪除）API Hook
 */
export function useSymbolLibrary(): UseSymbolLibraryReturn {
  const [symbols, setSymbols] = useState<SymbolItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSymbols = useCallback(async (): Promise<SymbolItem[]> => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/symbols");
      const data = (await res.json()) as { symbols?: SymbolItem[]; error?: string };
      if (!res.ok) throw new Error(data.error || "讀取快速符號庫失敗");
      const list = data.symbols || [];
      setSymbols(list);
      return list;
    } catch (err) {
      const msg = err instanceof Error ? err.message : "讀取快速符號發生錯誤";
      setError(msg);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const addSymbol = useCallback(
    async (payload: {
      label: string;
      value: string;
      mode: SymbolInsertMode;
    }): Promise<SymbolItem> => {
      setError(null);
      try {
        const res = await fetch("/api/symbols", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const data = (await res.json()) as { item?: SymbolItem; error?: string };
        if (!res.ok || !data.item) throw new Error(data.error || "新增快速符號失敗");
        await fetchSymbols();
        return data.item;
      } catch (err) {
        const msg = err instanceof Error ? err.message : "新增快速符號發生錯誤";
        setError(msg);
        throw err;
      }
    },
    [fetchSymbols]
  );

  const updateSymbol = useCallback(
    async (
      id: string,
      payload: { label: string; value: string; mode: SymbolInsertMode }
    ): Promise<SymbolItem> => {
      setError(null);
      try {
        const res = await fetch(`/api/symbols/${encodeURIComponent(id)}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const data = (await res.json()) as { item?: SymbolItem; error?: string };
        if (!res.ok || !data.item) throw new Error(data.error || "編輯快速符號失敗");
        await fetchSymbols();
        return data.item;
      } catch (err) {
        const msg = err instanceof Error ? err.message : "編輯快速符號發生錯誤";
        setError(msg);
        throw err;
      }
    },
    [fetchSymbols]
  );

  const deleteSymbol = useCallback(
    async (id: string): Promise<void> => {
      setError(null);
      try {
        const res = await fetch(`/api/symbols/${encodeURIComponent(id)}`, {
          method: "DELETE",
        });
        const data = (await res.json()) as { error?: string };
        if (!res.ok) throw new Error(data.error || "刪除快速符號失敗");
        await fetchSymbols();
      } catch (err) {
        const msg = err instanceof Error ? err.message : "刪除快速符號發生錯誤";
        setError(msg);
        throw err;
      }
    },
    [fetchSymbols]
  );

  return {
    symbols,
    isLoading,
    error,
    fetchSymbols,
    addSymbol,
    updateSymbol,
    deleteSymbol,
  };
}
