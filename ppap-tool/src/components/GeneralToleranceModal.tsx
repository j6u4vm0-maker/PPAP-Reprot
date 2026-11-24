"use client";

import React, { useEffect, useState } from "react";
import type {
  GeneralToleranceConfig,
  GeneralToleranceProfile,
  GeneralToleranceRule,
} from "@/types/ppap";
import { ToleranceRulesTable } from "./ToleranceRulesTable";

interface GeneralToleranceModalProps {
  isOpen: boolean;
  config: GeneralToleranceConfig;
  profiles: GeneralToleranceProfile[];
  onClose: () => void;
  onApplyToDrawing: (next: GeneralToleranceConfig) => void;
  onAddProfile: (name: string, rules: GeneralToleranceRule[]) => Promise<void>;
  onUpdateProfile: (id: string, name: string, rules: GeneralToleranceRule[]) => Promise<void>;
  onDeleteProfile: (id: string) => Promise<void>;
}

export function GeneralToleranceModal({
  isOpen,
  config,
  profiles,
  onClose,
  onApplyToDrawing,
  onAddProfile,
  onUpdateProfile,
  onDeleteProfile,
}: GeneralToleranceModalProps): React.ReactElement | null {
  const [enabled, setEnabled] = useState<boolean>(config.enabled);
  const [profileName, setProfileName] = useState<string>(config.profileName);
  const [rules, setRules] = useState<GeneralToleranceRule[]>(config.rules);
  const [editingProfileId, setEditingProfileId] = useState<string | null>(null);
  const [isBusy, setIsBusy] = useState<boolean>(false);

  useEffect(() => {
    if (!isOpen) return;
    setEnabled(config.enabled);
    setProfileName(config.profileName);
    setRules(config.rules.map((r) => ({ ...r })));
    setEditingProfileId(null);
  }, [config, isOpen]);

  if (!isOpen) return null;

  const updateRule = (idx: number, patch: Partial<GeneralToleranceRule>): void => {
    setRules((prev) => prev.map((r, i) => (i === idx ? { ...r, ...patch } : r)));
  };

  const addRuleRow = (): void => {
    const last = rules[rules.length - 1];
    const nextMin = last && last.maxDim !== null ? last.maxDim : 10;
    setRules((prev) => [
      ...prev,
      { id: `rule_${Date.now()}`, minDim: nextMin, maxDim: null, plus: "+0.50", minus: "-0.50" },
    ]);
  };

  const removeRuleRow = (idx: number): void => {
    if (rules.length <= 1) return;
    setRules((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleSaveAsProfile = async (): Promise<void> => {
    const name = profileName.trim();
    if (!name || rules.length === 0) return;
    setIsBusy(true);
    try {
      if (editingProfileId) {
        await onUpdateProfile(editingProfileId, name, rules);
        setEditingProfileId(null);
      } else {
        await onAddProfile(name, rules);
      }
    } finally {
      setIsBusy(false);
    }
  };

  const handleDeleteProfile = async (p: GeneralToleranceProfile): Promise<void> => {
    if (!confirm(`確定刪除一般公差範本「${p.name}」嗎？`)) return;
    setIsBusy(true);
    try {
      await onDeleteProfile(p.id);
      if (editingProfileId === p.id) setEditingProfileId(null);
    } finally {
      setIsBusy(false);
    }
  };

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/55 p-4"
    >
      <div className="flex max-h-[88vh] w-full max-w-2xl flex-col overflow-hidden rounded-xl bg-white shadow-2xl">
        <div className="flex items-start justify-between border-b border-slate-200 px-5 py-3.5">
          <div>
            <h3 className="text-base font-bold text-slate-900">⚙️ 一般公差設定與範本管理</h3>
            <p className="text-xs text-slate-500">
              規格列未填寫公差（留白且非參考尺寸）時，將自動依下方規則套用一般公差
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded p-1 text-slate-500 hover:bg-slate-100"
          >
            ✕
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-3.5">
          {/* Saved Profiles Bar (CRUD) */}
          <div className="mb-3 rounded-lg border border-slate-200 bg-slate-50 p-3">
            <div className="mb-1.5 text-xs font-bold text-slate-700">
              已儲存之一般公差範本庫（點擊載入／編輯／刪除）
            </div>
            <div className="flex flex-col gap-1.5">
              {profiles.map((p) => (
                <div
                  key={p.id}
                  className="flex items-center justify-between gap-2 rounded border border-slate-200 bg-white px-2.5 py-1.5 text-xs"
                >
                  <div className="min-w-0 flex-1">
                    <span className="font-semibold text-slate-800">{p.name}</span>
                    <span className="ml-2 text-[11px] text-slate-400">({p.rules.length} 段)</span>
                  </div>
                  <div className="flex shrink-0 items-center gap-1">
                    <button
                      type="button"
                      onClick={() => {
                        setProfileName(p.name);
                        setRules(p.rules.map((r) => ({ ...r })));
                        setEditingProfileId(null);
                      }}
                      className="rounded bg-emerald-50 px-2 py-0.5 font-semibold text-emerald-700 hover:bg-emerald-100"
                    >
                      套用
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setProfileName(p.name);
                        setRules(p.rules.map((r) => ({ ...r })));
                        setEditingProfileId(p.id);
                      }}
                      className="rounded px-2 py-0.5 font-semibold text-blue-700 hover:bg-blue-50"
                    >
                      編輯
                    </button>
                    <button
                      type="button"
                      disabled={isBusy}
                      onClick={() => void handleDeleteProfile(p)}
                      className="rounded px-2 py-0.5 font-semibold text-red-600 hover:bg-red-50"
                    >
                      刪除
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Current Rules Editor */}
          <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
            <label className="flex cursor-pointer items-center gap-1.5 text-xs font-bold text-slate-800">
              <input
                type="checkbox"
                checked={enabled}
                onChange={(e) => setEnabled(e.target.checked)}
              />
              <span>啟用一般公差自動帶入</span>
            </label>
            <button
              type="button"
              onClick={addRuleRow}
              className="rounded border border-slate-300 bg-white px-2.5 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-100"
            >
              ＋ 新增尺寸區間
            </button>
          </div>

          <ToleranceRulesTable
            rules={rules}
            onUpdateRule={updateRule}
            onRemoveRule={removeRuleRow}
          />

          {/* Save Profile Row */}
          <div className="mt-3 flex items-center gap-2 rounded-md border border-blue-200 bg-blue-50/50 p-2.5">
            <input
              type="text"
              value={profileName}
              onChange={(e) => setProfileName(e.target.value)}
              placeholder="輸入範本名稱以儲存至資料庫..."
              className="flex-1 rounded border border-slate-300 bg-white px-2.5 py-1 text-xs"
            />
            <button
              type="button"
              disabled={isBusy}
              onClick={() => void handleSaveAsProfile()}
              className="rounded bg-slate-800 px-3 py-1 text-xs font-semibold text-white hover:bg-slate-700 disabled:opacity-50"
            >
              {editingProfileId ? "💾 更新此範本" : "＋ 存為常用範本"}
            </button>
          </div>
        </div>

        <div className="flex justify-end gap-2 border-t border-slate-200 bg-slate-50 px-5 py-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-md border border-slate-300 bg-white px-3.5 py-1.5 text-xs font-semibold text-slate-700"
          >
            取消
          </button>
          <button
            type="button"
            onClick={() => {
              onApplyToDrawing({ enabled, profileName: profileName.trim() || "自訂一般公差", rules });
              onClose();
            }}
            className="rounded-md bg-blue-600 px-4 py-1.5 text-xs font-semibold text-white hover:bg-blue-700"
          >
            套用至本圖紙
          </button>
        </div>
      </div>
    </div>
  );
}
