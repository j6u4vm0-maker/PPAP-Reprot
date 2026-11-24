import type {
  GeneralToleranceConfig,
  GeneralToleranceRule,
  SpecItem,
} from "@/types/ppap";
import {
  computeLimits,
  getUnilateralType,
  isReferenceDimension,
  type SpecLimits,
  type UnilateralType,
} from "./specFormatter";

export interface ResolvedTolerance extends SpecLimits {
  tolerancePlus: string;
  toleranceMinus: string;
  isGeneralTolerance: boolean;
}

/**
 * 依據基準尺寸數值，從一般公差區間規則找出適用的正負公差
 */
export function matchGeneralToleranceRule(
  dimension: string,
  config: GeneralToleranceConfig
): GeneralToleranceRule | null {
  if (!config.enabled || config.rules.length === 0) return null;
  const numMatch = String(dimension ?? "").match(/(\d+(?:\.\d+)?)/);
  if (!numMatch) return config.rules[0] || null;

  const val = parseFloat(numMatch[1]);
  if (Number.isNaN(val)) return config.rules[0] || null;

  const sorted = [...config.rules].sort((a, b) => a.minDim - b.minDim);
  for (let i = 0; i < sorted.length; i++) {
    const r = sorted[i];
    const aboveMin = i === 0 ? val >= r.minDim : val > r.minDim;
    const belowMax = r.maxDim === null ? true : val <= r.maxDim;
    if (aboveMin && belowMax) return r;
  }
  return sorted[sorted.length - 1] || null;
}

/**
 * 計算單筆規格的「實際生效公差與上下限」（參考尺寸與 MAX/MIN 單邊不套用一般公差）
 */
export function resolveEffectiveSpec(
  spec: Pick<SpecItem, "dimension" | "tolerancePlus" | "toleranceMinus">,
  config: GeneralToleranceConfig
): ResolvedTolerance {
  const dim = String(spec.dimension ?? "").trim();
  if (!dim) {
    return {
      tolerancePlus: spec.tolerancePlus,
      toleranceMinus: spec.toleranceMinus,
      upperLimit: null,
      lowerLimit: null,
      valid: false,
      isReference: false,
      unilateralType: null,
      isGeneralTolerance: false,
    };
  }

  const unilateralType: UnilateralType = getUnilateralType(dim);
  if (isReferenceDimension(dim) || unilateralType !== null) {
    const lim = computeLimits(dim, "", "");
    return {
      ...lim,
      tolerancePlus: "",
      toleranceMinus: "",
      isGeneralTolerance: false,
    };
  }

  const hasPlus = Boolean(spec.tolerancePlus.trim());
  const hasMinus = Boolean(spec.toleranceMinus.trim());

  if (!hasPlus && !hasMinus && config.enabled) {
    const rule = matchGeneralToleranceRule(dim, config);
    if (rule) {
      const lim = computeLimits(dim, rule.plus, rule.minus);
      return {
        ...lim,
        tolerancePlus: rule.plus,
        toleranceMinus: rule.minus,
        isGeneralTolerance: true,
      };
    }
  }

  const lim = computeLimits(dim, spec.tolerancePlus, spec.toleranceMinus);
  return {
    ...lim,
    tolerancePlus: spec.tolerancePlus,
    toleranceMinus: spec.toleranceMinus,
    isGeneralTolerance: false,
  };
}

/**
 * 產生簡潔易讀的一般公差摘要文字
 */
export function formatGeneralToleranceSummary(config: GeneralToleranceConfig): string {
  if (!config.enabled) return "已停用";
  if (config.rules.length === 0) return "未設定";
  if (config.rules.length === 1) {
    const r = config.rules[0];
    const pAbs = r.plus.replace(/^\+/, "");
    const mAbs = r.minus.replace(/^-/, "");
    return pAbs === mAbs ? `±${pAbs}` : `${r.plus} / ${r.minus}`;
  }
  return config.rules
    .map((r) => {
      const range = r.maxDim === null ? `>${r.minDim}` : `${r.minDim}~${r.maxDim}`;
      const pAbs = r.plus.replace(/^\+/, "");
      const mAbs = r.minus.replace(/^-/, "");
      const tol = pAbs === mAbs ? `±${pAbs}` : `${r.plus}/${r.minus}`;
      return `${range}: ${tol}`;
    })
    .join(" ｜ ");
}
