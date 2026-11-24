import type { SymbolItem } from "@/types/ppap";

const SEED_TIME = "2026-11-24T22:00:00.000Z";

/**
 * 預設基本工程圖快速符號（支援後續完整新增、編輯、刪除）
 */
export const DEFAULT_SYMBOL_LIST: SymbolItem[] = [
  { id: "sym_paren", label: "( )", value: "()", mode: "wrap", createdAt: SEED_TIME, updatedAt: SEED_TIME },
  { id: "sym_dia", label: "Ø", value: "Ø", mode: "prefix", createdAt: SEED_TIME, updatedAt: SEED_TIME },
  { id: "sym_r", label: "R", value: "R", mode: "prefix", createdAt: SEED_TIME, updatedAt: SEED_TIME },
  { id: "sym_deg", label: "°", value: "°", mode: "suffix", createdAt: SEED_TIME, updatedAt: SEED_TIME },
  { id: "sym_pm", label: "±", value: "±", mode: "insert", createdAt: SEED_TIME, updatedAt: SEED_TIME },
  { id: "sym_max", label: "MAX", value: "MAX", mode: "suffix", createdAt: SEED_TIME, updatedAt: SEED_TIME },
  { id: "sym_min", label: "MIN", value: "MIN", mode: "suffix", createdAt: SEED_TIME, updatedAt: SEED_TIME },
  { id: "sym_ref", label: "REF", value: "REF", mode: "suffix", createdAt: SEED_TIME, updatedAt: SEED_TIME },
  { id: "sym_c", label: "C", value: "C", mode: "prefix", createdAt: SEED_TIME, updatedAt: SEED_TIME },
  { id: "sym_m", label: "M", value: "M", mode: "prefix", createdAt: SEED_TIME, updatedAt: SEED_TIME },
  { id: "sym_sq", label: "□", value: "□", mode: "prefix", createdAt: SEED_TIME, updatedAt: SEED_TIME },
];
