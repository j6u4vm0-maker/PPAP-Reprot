"use client";

import { useCallback, useState } from "react";
import type { EquipmentItem } from "@/types/ppap";

export interface UseEquipmentLibraryReturn {
  equipmentList: EquipmentItem[];
  isLoading: boolean;
  error: string | null;
  fetchEquipment: () => Promise<EquipmentItem[]>;
  addEquipment: (label: string) => Promise<EquipmentItem>;
  updateEquipment: (id: string, label: string) => Promise<EquipmentItem>;
  deleteEquipment: (id: string) => Promise<void>;
}

/**
 * 常用測試儀器庫 CRUD（新增、編輯、刪除）API Hook
 */
export function useEquipmentLibrary(): UseEquipmentLibraryReturn {
  const [equipmentList, setEquipmentList] = useState<EquipmentItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchEquipment = useCallback(async (): Promise<EquipmentItem[]> => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/equipment");
      const data = (await res.json()) as { equipment?: EquipmentItem[]; error?: string };
      if (!res.ok) throw new Error(data.error || "讀取常用測試儀器失敗");
      const list = data.equipment || [];
      setEquipmentList(list);
      return list;
    } catch (err) {
      const msg = err instanceof Error ? err.message : "讀取測試儀器發生錯誤";
      setError(msg);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const addEquipment = useCallback(
    async (label: string): Promise<EquipmentItem> => {
      setError(null);
      try {
        const res = await fetch("/api/equipment", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ label }),
        });
        const data = (await res.json()) as { item?: EquipmentItem; error?: string };
        if (!res.ok || !data.item) throw new Error(data.error || "新增測試儀器失敗");
        await fetchEquipment();
        return data.item;
      } catch (err) {
        const msg = err instanceof Error ? err.message : "新增測試儀器發生錯誤";
        setError(msg);
        throw err;
      }
    },
    [fetchEquipment]
  );

  const updateEquipment = useCallback(
    async (id: string, label: string): Promise<EquipmentItem> => {
      setError(null);
      try {
        const res = await fetch(`/api/equipment/${encodeURIComponent(id)}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ label }),
        });
        const data = (await res.json()) as { item?: EquipmentItem; error?: string };
        if (!res.ok || !data.item) throw new Error(data.error || "編輯測試儀器失敗");
        await fetchEquipment();
        return data.item;
      } catch (err) {
        const msg = err instanceof Error ? err.message : "編輯測試儀器發生錯誤";
        setError(msg);
        throw err;
      }
    },
    [fetchEquipment]
  );

  const deleteEquipment = useCallback(
    async (id: string): Promise<void> => {
      setError(null);
      try {
        const res = await fetch(`/api/equipment/${encodeURIComponent(id)}`, {
          method: "DELETE",
        });
        const data = (await res.json()) as { error?: string };
        if (!res.ok) throw new Error(data.error || "刪除測試儀器失敗");
        await fetchEquipment();
      } catch (err) {
        const msg = err instanceof Error ? err.message : "刪除測試儀器發生錯誤";
        setError(msg);
        throw err;
      }
    },
    [fetchEquipment]
  );

  return {
    equipmentList,
    isLoading,
    error,
    fetchEquipment,
    addEquipment,
    updateEquipment,
    deleteEquipment,
  };
}
