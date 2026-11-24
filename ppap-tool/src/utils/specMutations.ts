import type {
  BalloonPosition,
  BalloonStyle,
  CropRect,
  DrawingRecord,
  GeneralToleranceConfig,
  Page3Data,
  Page4Data,
  ParsedSpecRow,
  SpecItem,
} from "@/types/ppap";
import { createDefaultGeneralTolerance } from "@/lib/defaultTolerances";
import {
  createDefaultPage3,
  createDefaultPage4,
  DEFAULT_BALLOON_STYLE,
} from "./constants";
import {
  computeLimits,
  formatBalloonLabel,
  getUnilateralType,
  parseSingleSpecFormula,
  renumberSpecs,
} from "./specFormatter";

/**
 * 將資料庫紀錄轉換為編輯器狀態
 */
export function normalizeRecordForEditor(rec: DrawingRecord): {
  id: string;
  sourceFile: string | null;
  balloonStyle: BalloonStyle;
  generalTolerance: GeneralToleranceConfig;
  cropRect: CropRect | null;
  page3: Page3Data;
  page4: Page4Data;
  notes: string;
} {
  const style: BalloonStyle = { ...DEFAULT_BALLOON_STYLE, ...(rec.balloonStyle || {}) };
  return {
    id: rec.id,
    sourceFile: rec.sourceFile || null,
    balloonStyle: style,
    generalTolerance: rec.generalTolerance || createDefaultGeneralTolerance(),
    cropRect: rec.cropRect || null,
    page3: {
      ...createDefaultPage3(),
      ...rec.page3,
      judgementSyncWithTestStandard: rec.page3?.judgementSyncWithTestStandard !== false,
      testEquipment: Array.isArray(rec.page3?.testEquipment) ? rec.page3.testEquipment : [],
    },
    page4: {
      ...createDefaultPage4(),
      ...rec.page4,
      specifications: renumberSpecs(rec.page4?.specifications || [], style.padZero),
    },
    notes: rec.notes || "",
  };
}

/**
 * 建立一筆空白尺寸規格列
 */
export function appendEmptySpec(
  specs: SpecItem[],
  padZero: boolean,
  defaultQty: number
): SpecItem[] {
  const nextItem = specs.length + 1;
  return [
    ...specs,
    {
      item: nextItem,
      balloonLabel: formatBalloonLabel(nextItem, padZero),
      dimension: "",
      tolerancePlus: "",
      toleranceMinus: "",
      upperLimit: null,
      lowerLimit: null,
      cavity: "1",
      testQuantity: defaultQty || 5,
      balloonPosition: null,
    },
  ];
}

/**
 * 依快速公式字串新增規格列
 */
export function appendFormulaSpec(
  specs: SpecItem[],
  formula: string,
  padZero: boolean,
  defaultQty: number
): SpecItem[] | null {
  const parsed = parseSingleSpecFormula(formula);
  if (!parsed) return null;
  const lim = computeLimits(parsed.dimension, parsed.tolerancePlus, parsed.toleranceMinus);
  const nextItem = specs.length + 1;
  return [
    ...specs,
    {
      item: nextItem,
      balloonLabel: formatBalloonLabel(nextItem, padZero),
      dimension: parsed.dimension,
      tolerancePlus: parsed.tolerancePlus,
      toleranceMinus: parsed.toleranceMinus,
      upperLimit: lim.upperLimit,
      lowerLimit: lim.lowerLimit,
      cavity: "1",
      testQuantity: defaultQty || 5,
      balloonPosition: null,
    },
  ];
}

/**
 * 更新單筆規格欄位並同步對稱公差與上下限
 */
export function patchSpecItem(
  specs: SpecItem[],
  idx: number,
  patch: Partial<SpecItem>,
  syncSymmetricMinus: boolean
): SpecItem[] {
  const current = specs[idx];
  if (!current) return specs;

  const next: SpecItem = { ...current, ...patch };
  if (patch.dimension !== undefined && getUnilateralType(next.dimension) !== null) {
    next.tolerancePlus = "";
    next.toleranceMinus = "";
  }
  if (syncSymmetricMinus && patch.tolerancePlus !== undefined) {
    const cleaned = patch.tolerancePlus.trim().replace(/^[+-]/, "");
    if (cleaned !== "" && !Number.isNaN(Number(cleaned))) {
      next.toleranceMinus = `-${cleaned}`;
    }
  }
  const lim = computeLimits(next.dimension, next.tolerancePlus, next.toleranceMinus);
  next.upperLimit = lim.upperLimit;
  next.lowerLimit = lim.lowerLimit;

  const list = [...specs];
  list[idx] = next;
  return list;
}

/**
 * 套用貼上的多筆規格列（支援取代保留原座標或附加）
 */
export function mergePastedSpecs(
  specs: SpecItem[],
  rows: ParsedSpecRow[],
  replaceMode: boolean,
  padZero: boolean,
  defaultQty: number
): SpecItem[] {
  const oldPositions = specs.map((s) => s.balloonPosition);
  const mapped: SpecItem[] = rows.map((r, i) => {
    const lim = computeLimits(r.dimension, r.tolerancePlus, r.toleranceMinus);
    return {
      item: i + 1,
      balloonLabel: formatBalloonLabel(i + 1, padZero),
      dimension: r.dimension,
      tolerancePlus: r.tolerancePlus,
      toleranceMinus: r.toleranceMinus,
      upperLimit: lim.upperLimit,
      lowerLimit: lim.lowerLimit,
      cavity: r.cavity || "1",
      testQuantity: r.testQuantity || defaultQty || 5,
      balloonPosition: replaceMode ? oldPositions[i] || null : null,
    };
  });
  const combined = replaceMode ? mapped : [...specs, ...mapped];
  return renumberSpecs(combined, padZero);
}

/**
 * 處理畫布點擊放置球標：優先指定項次 → 下一個未定位項次 → 自動新增項次
 */
export function placeBalloonInSpecs(
  specs: SpecItem[],
  pos: BalloonPosition,
  targetItemIndex: number | null,
  padZero: boolean,
  defaultQty: number
): { nextSpecs: SpecItem[]; placedIndex: number; placedLabel: string; clearedTarget: boolean } {
  const list = [...specs];

  if (targetItemIndex !== null && list[targetItemIndex]) {
    list[targetItemIndex] = { ...list[targetItemIndex], balloonPosition: pos };
    return {
      nextSpecs: list,
      placedIndex: targetItemIndex,
      placedLabel: formatBalloonLabel(list[targetItemIndex].item, padZero),
      clearedTarget: true,
    };
  }

  const nextUnplaced = list.findIndex((s) => !s.balloonPosition);
  if (nextUnplaced >= 0) {
    list[nextUnplaced] = { ...list[nextUnplaced], balloonPosition: pos };
    return {
      nextSpecs: list,
      placedIndex: nextUnplaced,
      placedLabel: formatBalloonLabel(list[nextUnplaced].item, padZero),
      clearedTarget: false,
    };
  }

  const nextNum = list.length + 1;
  const label = formatBalloonLabel(nextNum, padZero);
  list.push({
    item: nextNum,
    balloonLabel: label,
    dimension: "",
    tolerancePlus: "",
    toleranceMinus: "",
    upperLimit: null,
    lowerLimit: null,
    cavity: "1",
    testQuantity: defaultQty || 5,
    balloonPosition: pos,
  });
  return {
    nextSpecs: list,
    placedIndex: list.length - 1,
    placedLabel: label,
    clearedTarget: false,
  };
}
