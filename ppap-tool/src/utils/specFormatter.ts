import type { SpecItem } from "@/types/ppap";

export type UnilateralType = "max" | "min" | null;

export interface SpecLimits {
  upperLimit: number | null;
  lowerLimit: number | null;
  valid: boolean;
  isReference: boolean;
  unilateralType: UnilateralType;
}

export interface FormulaResult {
  dimension: string;
  tolerancePlus: string;
  toleranceMinus: string;
}

/**
 * 格式化球標編號（預設補零如 01, 02）
 */
export function formatBalloonLabel(itemNum: number, padZero: boolean): string {
  const n = Number(itemNum) || 1;
  return padZero ? String(n).padStart(2, "0") : String(n);
}

/**
 * 格式化基準尺寸小數位數（至少保留兩位小數）
 */
export function formatDecimalString(val: string | number, minDecimals = 2): string {
  const str = String(val ?? "").trim();
  if (!str) return "";
  const num = Number(str);
  if (Number.isNaN(num)) return str;
  const parts = str.replace(/^[+-]/, "").split(".");
  const decimals = Math.max(minDecimals, parts[1] ? parts[1].length : 0);
  return num.toFixed(Math.min(decimals, 4));
}

/**
 * 格式化正負公差字串（強制帶上 + 或 - 符號）
 */
export function formatToleranceString(val: string | number, sign: "+" | "-"): string {
  const raw = String(val ?? "").trim();
  if (!raw) return "";
  const cleaned = raw.replace(/^[+-]/, "");
  const num = Number(cleaned);
  if (Number.isNaN(num)) return raw;
  const parts = cleaned.split(".");
  const decimals = Math.max(2, parts[1] ? parts[1].length : 0);
  const formatted = Math.abs(num).toFixed(Math.min(decimals, 4));
  return `${sign}${formatted}`;
}

/**
 * 判斷是否為參考尺寸（以括號包覆或含 REF 字樣）
 */
export function isReferenceDimension(dimension: string): boolean {
  const s = String(dimension ?? "").trim();
  if (!s) return false;
  if (/^\(.+\)$/.test(s)) return true;
  return /\bREF\b/i.test(s);
}

/**
 * 判斷是否為單邊規格（MAX 無下限 / MIN 無上限）
 */
export function getUnilateralType(dimension: string): UnilateralType {
  const s = String(dimension ?? "").trim();
  if (!s || isReferenceDimension(s)) return null;
  if (/(?:^|[^A-Za-z])MAX(?:[^A-Za-z]|$)/i.test(s)) return "max";
  if (/(?:^|[^A-Za-z])MIN(?:[^A-Za-z]|$)/i.test(s)) return "min";
  return null;
}

/**
 * 格式化允收範圍顯示文字（支援參考、MAX/MIN 單邊與一般區間）
 */
export function formatLimitDisplay(lim: SpecLimits): string {
  if (lim.isReference) return "參考";
  if (!lim.valid) return "—";
  if (lim.unilateralType === "max" && lim.upperLimit !== null) {
    return `≤ ${lim.upperLimit.toFixed(2)}`;
  }
  if (lim.unilateralType === "min" && lim.lowerLimit !== null) {
    return `≥ ${lim.lowerLimit.toFixed(2)}`;
  }
  if (lim.lowerLimit !== null && lim.upperLimit !== null) {
    return `${lim.lowerLimit.toFixed(2)} ~ ${lim.upperLimit.toFixed(2)}`;
  }
  return "—";
}

/**
 * 保留前綴／後綴／括號符號並整理基準尺寸小數位數（角度與螺紋維持原樣）
 */
export function formatDimensionWithSymbols(val: string | number, minDecimals = 2): string {
  const str = String(val ?? "").trim();
  if (!str) return "";
  if (str.includes("°") || /^M\d/i.test(str)) return str;

  const match = str.match(/^([^0-9.-]*)(\d+(?:\.\d+)?)(.*)$/);
  if (!match) return str;
  const [, prefix, numPart, suffix] = match;
  return `${prefix}${formatDecimalString(numPart, minDecimals)}${suffix}`;
}

const INVALID_LIMITS: SpecLimits = {
  upperLimit: null,
  lowerLimit: null,
  valid: false,
  isReference: false,
  unilateralType: null,
};

/**
 * 依據基準尺寸與正負公差計算允收上下限（自動支援符號前綴／後綴、MAX/MIN 單邊與參考尺寸判定）
 */
export function computeLimits(
  dimension: string,
  tolPlus: string,
  tolMinus: string
): SpecLimits {
  const trimmed = String(dimension ?? "").trim();
  if (!trimmed) return INVALID_LIMITS;
  if (isReferenceDimension(trimmed)) {
    return { ...INVALID_LIMITS, valid: true, isReference: true };
  }

  const numMatch = trimmed.match(/(\d+(?:\.\d+)?)/);
  if (!numMatch) return INVALID_LIMITS;
  const d = parseFloat(numMatch[1]);
  if (Number.isNaN(d)) return INVALID_LIMITS;

  const unilateralType = getUnilateralType(trimmed);
  if (unilateralType === "max") {
    return { ...INVALID_LIMITS, upperLimit: Number(d.toFixed(4)), valid: true, unilateralType: "max" };
  }
  if (unilateralType === "min") {
    return { ...INVALID_LIMITS, lowerLimit: Number(d.toFixed(4)), valid: true, unilateralType: "min" };
  }

  const p = parseFloat(String(tolPlus || "").replace(/^\+/, ""));
  const m = parseFloat(String(tolMinus || "").replace(/^-/, ""));
  const upperLimit = Number.isNaN(p) ? d : Number((d + Math.abs(p)).toFixed(4));
  const lowerLimit = Number.isNaN(m) ? d : Number((d - Math.abs(m)).toFixed(4));
  return { upperLimit, lowerLimit, valid: true, isReference: false, unilateralType: null };
}

/**
 * 組合 P3 的「測試標準/版次/發行日期」顯示字串
 */
export function getCombinedStandardRevDate(
  testStandard: string,
  revision: string,
  issueDate: string
): string {
  return [testStandard.trim(), revision.trim(), issueDate.trim()].filter(Boolean).join("/");
}

/**
 * 重新為所有規格列順號並同步上下限
 */
export function renumberSpecs(specs: SpecItem[], padZero: boolean): SpecItem[] {
  return specs.map((spec, idx) => {
    const itemNum = idx + 1;
    const lim = computeLimits(spec.dimension, spec.tolerancePlus, spec.toleranceMinus);
    return {
      ...spec,
      item: itemNum,
      balloonLabel: formatBalloonLabel(itemNum, padZero),
      upperLimit: lim.upperLimit,
      lowerLimit: lim.lowerLimit,
    };
  });
}

/**
 * 解析單筆快速輸入公式（支援 3.2±0.1、2.5 +0.15/-0.10、3.5 MIN、2.0 MAX、7.4）
 */
export function parseSingleSpecFormula(input: string): FormulaResult | null {
  const s = input.trim();
  if (!s) return null;

  const uniSuffix = s.match(/^([^0-9.-]*?)(\d+(?:\.\d+)?)\s*(MAX|MIN)\.?$/i);
  if (uniSuffix) {
    const [, prefix, num, tag] = uniSuffix;
    return {
      dimension: `${prefix.trim()}${formatDecimalString(num, 2)} ${tag.toUpperCase()}`,
      tolerancePlus: "",
      toleranceMinus: "",
    };
  }

  const uniPrefix = s.match(/^(MAX|MIN)\.?\s*([^0-9.-]*?)(\d+(?:\.\d+)?)$/i);
  if (uniPrefix) {
    const [, tag, prefix, num] = uniPrefix;
    return {
      dimension: `${prefix.trim()}${formatDecimalString(num, 2)} ${tag.toUpperCase()}`,
      tolerancePlus: "",
      toleranceMinus: "",
    };
  }

  const symMatch = s.match(/^(\d+(?:\.\d+)?)\s*(?:±|\+\/-|\+\s*\/\s*-)\s*(\d+(?:\.\d+)?)$/);
  if (symMatch) {
    return {
      dimension: formatDecimalString(symMatch[1], 2),
      tolerancePlus: formatToleranceString(symMatch[2], "+"),
      toleranceMinus: formatToleranceString(symMatch[2], "-"),
    };
  }

  const asymMatch = s.match(/^(\d+(?:\.\d+)?)\s*\+(\d+(?:\.\d+)?)\s*[/,\s]\s*-(\d+(?:\.\d+)?)$/);
  if (asymMatch) {
    return {
      dimension: formatDecimalString(asymMatch[1], 2),
      tolerancePlus: formatToleranceString(asymMatch[2], "+"),
      toleranceMinus: formatToleranceString(asymMatch[3], "-"),
    };
  }

  const plainMatch = s.match(/^(\d+(?:\.\d+)?)$/);
  if (plainMatch) {
    return {
      dimension: formatDecimalString(plainMatch[1], 2),
      tolerancePlus: "",
      toleranceMinus: "",
    };
  }

  return null;
}

/**
 * 格式化時間顯示
 */
export function formatDateTime(iso: string | undefined): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  const pad = (n: number): string => String(n).padStart(2, "0");
  return `${d.getFullYear()}/${pad(d.getMonth() + 1)}/${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
