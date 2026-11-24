"use client";

import { useCallback, useState } from "react";
import type { GeneralToleranceProfile, GeneralToleranceRule } from "@/types/ppap";

export interface UseToleranceLibraryReturn {
  profiles: GeneralToleranceProfile[];
  isLoading: boolean;
  error: string | null;
  fetchProfiles: () => Promise<GeneralToleranceProfile[]>;
  addProfile: (name: string, rules: GeneralToleranceRule[]) => Promise<GeneralToleranceProfile>;
  updateProfile: (
    id: string,
    name: string,
    rules: GeneralToleranceRule[]
  ) => Promise<GeneralToleranceProfile>;
  deleteProfile: (id: string) => Promise<void>;
}

/**
 * 一般公差範本庫 CRUD（新增、編輯、刪除）API Hook
 */
export function useToleranceLibrary(): UseToleranceLibraryReturn {
  const [profiles, setProfiles] = useState<GeneralToleranceProfile[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchProfiles = useCallback(async (): Promise<GeneralToleranceProfile[]> => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/tolerances");
      const data = (await res.json()) as { profiles?: GeneralToleranceProfile[]; error?: string };
      if (!res.ok) throw new Error(data.error || "讀取一般公差範本庫失敗");
      const list = data.profiles || [];
      setProfiles(list);
      return list;
    } catch (err) {
      const msg = err instanceof Error ? err.message : "讀取一般公差範本發生錯誤";
      setError(msg);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const addProfile = useCallback(
    async (name: string, rules: GeneralToleranceRule[]): Promise<GeneralToleranceProfile> => {
      setError(null);
      try {
        const res = await fetch("/api/tolerances", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, rules }),
        });
        const data = (await res.json()) as { profile?: GeneralToleranceProfile; error?: string };
        if (!res.ok || !data.profile) throw new Error(data.error || "新增一般公差範本失敗");
        await fetchProfiles();
        return data.profile;
      } catch (err) {
        const msg = err instanceof Error ? err.message : "新增一般公差範本發生錯誤";
        setError(msg);
        throw err;
      }
    },
    [fetchProfiles]
  );

  const updateProfile = useCallback(
    async (
      id: string,
      name: string,
      rules: GeneralToleranceRule[]
    ): Promise<GeneralToleranceProfile> => {
      setError(null);
      try {
        const res = await fetch(`/api/tolerances/${encodeURIComponent(id)}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, rules }),
        });
        const data = (await res.json()) as { profile?: GeneralToleranceProfile; error?: string };
        if (!res.ok || !data.profile) throw new Error(data.error || "編輯一般公差範本失敗");
        await fetchProfiles();
        return data.profile;
      } catch (err) {
        const msg = err instanceof Error ? err.message : "編輯一般公差範本發生錯誤";
        setError(msg);
        throw err;
      }
    },
    [fetchProfiles]
  );

  const deleteProfile = useCallback(
    async (id: string): Promise<void> => {
      setError(null);
      try {
        const res = await fetch(`/api/tolerances/${encodeURIComponent(id)}`, {
          method: "DELETE",
        });
        const data = (await res.json()) as { error?: string };
        if (!res.ok) throw new Error(data.error || "刪除一般公差範本失敗");
        await fetchProfiles();
      } catch (err) {
        const msg = err instanceof Error ? err.message : "刪除一般公差範本發生錯誤";
        setError(msg);
        throw err;
      }
    },
    [fetchProfiles]
  );

  return {
    profiles,
    isLoading,
    error,
    fetchProfiles,
    addProfile,
    updateProfile,
    deleteProfile,
  };
}
