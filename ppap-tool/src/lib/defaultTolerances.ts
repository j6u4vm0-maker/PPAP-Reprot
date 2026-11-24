import type { GeneralToleranceConfig, GeneralToleranceProfile } from "@/types/ppap";

const SEED_TIME = "2026-11-24T22:30:00.000Z";

/**
 * 預設單張圖紙一般公差設定（比照 KST 圖紙預設 0 > mm ±0.50）
 */
export function createDefaultGeneralTolerance(): GeneralToleranceConfig {
  return {
    enabled: true,
    profileName: "KST 標準一般公差 (±0.50)",
    rules: [
      { id: "rule_default_1", minDim: 0, maxDim: null, plus: "+0.50", minus: "-0.50" },
    ],
  };
}

/**
 * 預設一般公差範本庫（持久化於本地資料庫，支援完整新增／編輯／刪除）
 */
export const DEFAULT_GENERAL_TOLERANCE_PROFILES: GeneralToleranceProfile[] = [
  {
    id: "gtol_kst_050",
    name: "KST 標準一般公差 (±0.50)",
    rules: [
      { id: "r_kst_1", minDim: 0, maxDim: null, plus: "+0.50", minus: "-0.50" },
    ],
    createdAt: SEED_TIME,
    updatedAt: SEED_TIME,
  },
  {
    id: "gtol_fine_020",
    name: "精密一般公差 (±0.20)",
    rules: [
      { id: "r_fine_1", minDim: 0, maxDim: null, plus: "+0.20", minus: "-0.20" },
    ],
    createdAt: SEED_TIME,
    updatedAt: SEED_TIME,
  },
  {
    id: "gtol_stepped",
    name: "分段一般公差 (0~10: ±0.20 / >10: ±0.50)",
    rules: [
      { id: "r_step_1", minDim: 0, maxDim: 10, plus: "+0.20", minus: "-0.20" },
      { id: "r_step_2", minDim: 10, maxDim: 50, plus: "+0.50", minus: "-0.50" },
      { id: "r_step_3", minDim: 50, maxDim: null, plus: "+1.00", minus: "-1.00" },
    ],
    createdAt: SEED_TIME,
    updatedAt: SEED_TIME,
  },
];
