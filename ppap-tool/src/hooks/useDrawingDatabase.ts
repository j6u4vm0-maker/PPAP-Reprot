"use client";

import { useCallback, useState } from "react";
import type {
  DatabaseBackupPayload,
  DrawingRecord,
  PatchDrawingMetaPayload,
  SaveDrawingPayload,
} from "@/types/ppap";

export interface UseDrawingDatabaseReturn {
  drawings: DrawingRecord[];
  isLoading: boolean;
  error: string | null;
  fetchDrawings: (query?: string) => Promise<DrawingRecord[]>;
  saveDrawing: (payload: SaveDrawingPayload) => Promise<DrawingRecord>;
  patchDrawingMeta: (id: string, payload: PatchDrawingMetaPayload) => Promise<DrawingRecord>;
  deleteDrawing: (id: string) => Promise<void>;
  exportBackup: () => Promise<DatabaseBackupPayload>;
  restoreBackup: (backup: DatabaseBackupPayload, mode?: "merge" | "replace") => Promise<number>;
}

/**
 * 圖紙資料庫 CRUD 與備份還原 API Hook
 */
export function useDrawingDatabase(): UseDrawingDatabaseReturn {
  const [drawings, setDrawings] = useState<DrawingRecord[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchDrawings = useCallback(async (query = ""): Promise<DrawingRecord[]> => {
    setIsLoading(true);
    setError(null);
    try {
      const url = query ? `/api/drawings?q=${encodeURIComponent(query)}` : "/api/drawings";
      const res = await fetch(url);
      const data = (await res.json()) as { drawings?: DrawingRecord[]; error?: string };
      if (!res.ok) throw new Error(data.error || "讀取圖紙資料庫失敗");
      const list = data.drawings || [];
      if (!query) setDrawings(list);
      return list;
    } catch (err) {
      const msg = err instanceof Error ? err.message : "讀取圖紙資料庫發生錯誤";
      setError(msg);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const saveDrawing = useCallback(async (payload: SaveDrawingPayload): Promise<DrawingRecord> => {
    setError(null);
    try {
      const res = await fetch("/api/drawings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      let data: { drawing?: DrawingRecord; error?: string } = {};
      try {
        data = (await res.json()) as { drawing?: DrawingRecord; error?: string };
      } catch {
        throw new Error(
          res.status === 413
            ? "圖檔容量過大導致無法上傳，請裁切或壓縮圖檔後重試"
            : `伺服器回應異常 (HTTP ${res.status})`
        );
      }
      if (!res.ok || !data.drawing) {
        throw new Error(data.error || `儲存圖紙失敗 (HTTP ${res.status})`);
      }
      await fetchDrawings();
      return data.drawing;
    } catch (err) {
      const rawMsg = err instanceof Error ? err.message : "儲存圖紙發生錯誤";
      const friendlyMsg = /failed to fetch|networkerror|load failed/i.test(rawMsg)
        ? "無法連線到本地伺服器 (localhost:3880)，請確認「啟動PPAP尺寸工具.bat」視窗仍在執行中！"
        : rawMsg;
      setError(friendlyMsg);
      throw new Error(friendlyMsg);
    }
  }, [fetchDrawings]);

  const patchDrawingMeta = useCallback(
    async (id: string, payload: PatchDrawingMetaPayload): Promise<DrawingRecord> => {
      setError(null);
      try {
        const res = await fetch(`/api/drawings/${encodeURIComponent(id)}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const data = (await res.json()) as { drawing?: DrawingRecord; error?: string };
        if (!res.ok || !data.drawing) {
          throw new Error(data.error || "編輯圖紙基本資訊失敗");
        }
        await fetchDrawings();
        return data.drawing;
      } catch (err) {
        const msg = err instanceof Error ? err.message : "編輯圖紙資訊發生錯誤";
        setError(msg);
        throw err;
      }
    },
    [fetchDrawings]
  );

  const deleteDrawing = useCallback(
    async (id: string): Promise<void> => {
      setError(null);
      try {
        const res = await fetch(`/api/drawings/${encodeURIComponent(id)}`, {
          method: "DELETE",
        });
        const data = (await res.json()) as { ok?: boolean; error?: string };
        if (!res.ok) throw new Error(data.error || "刪除圖紙失敗");
        await fetchDrawings();
      } catch (err) {
        const msg = err instanceof Error ? err.message : "刪除圖紙發生錯誤";
        setError(msg);
        throw err;
      }
    },
    [fetchDrawings]
  );

  const exportBackup = useCallback(async (): Promise<DatabaseBackupPayload> => {
    try {
      const res = await fetch("/api/database/backup");
      const data = (await res.json()) as DatabaseBackupPayload & { error?: string };
      if (!res.ok) throw new Error(data.error || "匯出資料庫備份失敗");
      return data;
    } catch (err) {
      const msg = err instanceof Error ? err.message : "匯出備份發生錯誤";
      setError(msg);
      throw err;
    }
  }, []);

  const restoreBackup = useCallback(
    async (backup: DatabaseBackupPayload, mode: "merge" | "replace" = "merge"): Promise<number> => {
      try {
        const res = await fetch("/api/database/restore", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...backup, mode }),
        });
        const data = (await res.json()) as { importedCount?: number; error?: string };
        if (!res.ok) throw new Error(data.error || "還原資料庫備份失敗");
        await fetchDrawings();
        return data.importedCount || 0;
      } catch (err) {
        const msg = err instanceof Error ? err.message : "還原備份發生錯誤";
        setError(msg);
        throw err;
      }
    },
    [fetchDrawings]
  );

  return {
    drawings,
    isLoading,
    error,
    fetchDrawings,
    saveDrawing,
    patchDrawingMeta,
    deleteDrawing,
    exportBackup,
    restoreBackup,
  };
}
