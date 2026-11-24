import type {
  BalloonStyle,
  CropRect,
  GeneralToleranceConfig,
  Page3Data,
  Page4Data,
  SpecItem,
  TransferJsonPayload,
} from "@/types/ppap";
import { createDefaultGeneralTolerance } from "@/lib/defaultTolerances";
import { DEFAULT_BALLOON_STYLE } from "./constants";
import { resolveEffectiveSpec } from "./generalTolerance";
import { computeLimits, formatBalloonLabel, getCombinedStandardRevDate } from "./specFormatter";

export interface BuildTransferParams {
  page3: Page3Data;
  page4: Page4Data;
  balloonStyle: BalloonStyle;
  generalTolerance: GeneralToleranceConfig;
  cropRect: CropRect | null;
  sourceFileName: string;
  rotation?: number;
  notes: string;
  compositeImageBase64: string | null;
}

/**
 * 產生標準化跨系統移轉用 JSON 資料結構（自動帶入一般公差並標記直式報告）
 */
export function buildTransferJson(params: BuildTransferParams): TransferJsonPayload {
  const {
    page3,
    page4,
    balloonStyle,
    generalTolerance,
    cropRect,
    sourceFileName,
    rotation,
    notes,
    compositeImageBase64,
  } = params;

  const sampleNum = Math.max(1, Number(page3.sampleQtyNumber) || 5);
  const testStd = page3.testStandard.trim();
  const judgementStd = page3.judgementSyncWithTestStandard
    ? testStd
    : page3.judgementStandard.trim();
  const partNo = page3.itemNo.trim();

  const specs: SpecItem[] = page4.specifications.map((s, idx) => {
    const itemNum = idx + 1;
    const resolved = resolveEffectiveSpec(s, generalTolerance);
    return {
      item: itemNum,
      balloonLabel: formatBalloonLabel(itemNum, balloonStyle.padZero),
      dimension: s.dimension,
      tolerancePlus: resolved.tolerancePlus,
      toleranceMinus: resolved.toleranceMinus,
      upperLimit: resolved.upperLimit,
      lowerLimit: resolved.lowerLimit,
      cavity: String(s.cavity || "1"),
      testQuantity: Number(s.testQuantity) || sampleNum,
      balloonPosition: s.balloonPosition ? { ...s.balloonPosition } : null,
    };
  });

  return {
    schemaVersion: "1.1",
    exportedAt: new Date().toISOString(),
    reportOrientation: "portrait",
    partNo,
    page3: {
      testItems: page3.testItems.trim() || "1.尺寸量測 Size Measurement",
      itemNo: partNo,
      sampleQty: `${sampleNum} PCS`,
      sampleQtyNumber: sampleNum,
      testStandard: testStd,
      revision: page3.revision.trim(),
      issueDate: page3.issueDate.trim(),
      combinedStandardRevDate: getCombinedStandardRevDate(
        testStd,
        page3.revision,
        page3.issueDate
      ),
      testConditions: page3.testConditions.trim() || "無",
      judgementStandard: judgementStd,
      testEquipment: page3.testEquipment.map((e) => e.trim()).filter(Boolean),
      balloonedDrawingImageBase64: compositeImageBase64,
    },
    page4: {
      organization: page4.organization.trim() || "KST",
      inspectionDivision: page4.inspectionDivision.trim() || "QC",
      partNumber: partNo,
      partName: page4.partName.trim(),
      levelRecordOfDesignChange: page4.levelRecordOfDesignChange.trim() || "N/A",
      documentOfEngineeringChange: page4.documentOfEngineeringChange.trim() || "N/A",
      specifications: specs,
    },
    meta: {
      sourceFileName,
      rotation: rotation || 0,
      balloonStyle: { ...balloonStyle },
      generalTolerance: {
        ...generalTolerance,
        rules: generalTolerance.rules.map((r) => ({ ...r })),
      },
      cropRect: cropRect ? { ...cropRect } : null,
      notes,
    },
  };
}

/**
 * 嚴格驗證匯入的 JSON 移轉檔（不使用 any）
 */
export function parseTransferJsonText(rawText: string): {
  page3: Page3Data;
  page4: Page4Data;
  balloonStyle: BalloonStyle;
  generalTolerance: GeneralToleranceConfig;
  cropRect: CropRect | null;
  notes: string;
  imageBase64: string | null;
} {
  const parsed: unknown = JSON.parse(rawText);
  if (typeof parsed !== "object" || parsed === null) {
    throw new Error("JSON 內容格式不正確");
  }

  const obj = parsed as Partial<TransferJsonPayload>;
  if (!obj.page3 || !obj.page4) {
    throw new Error("JSON 檔案缺少 page3 或 page4 結構");
  }

  const testStd = String(obj.page3.testStandard || "");
  const judgementStd = String(obj.page3.judgementStandard || testStd);
  const sampleQtyNumber = Math.max(1, Number(obj.page3.sampleQtyNumber) || 5);
  const itemNo = String(obj.page3.itemNo || obj.partNo || "");
  const style: BalloonStyle = {
    ...DEFAULT_BALLOON_STYLE,
    ...(obj.meta?.balloonStyle || {}),
  };

  const page3: Page3Data = {
    testItems: String(obj.page3.testItems || "1.尺寸量測 Size Measurement"),
    itemNo,
    sampleQtyNumber,
    sampleQty: `${sampleQtyNumber} PCS`,
    testStandard: testStd,
    revision: String(obj.page3.revision || ""),
    issueDate: String(obj.page3.issueDate || ""),
    combinedStandardRevDate: getCombinedStandardRevDate(
      testStd,
      String(obj.page3.revision || ""),
      String(obj.page3.issueDate || "")
    ),
    testConditions: String(obj.page3.testConditions || "無"),
    judgementStandard: judgementStd,
    judgementSyncWithTestStandard: judgementStd === testStd,
    testEquipment: Array.isArray(obj.page3.testEquipment)
      ? obj.page3.testEquipment.map(String)
      : [],
  };

  const specs: SpecItem[] = Array.isArray(obj.page4.specifications)
    ? obj.page4.specifications.map((s, idx) => {
        const lim = computeLimits(
          String(s.dimension || ""),
          String(s.tolerancePlus || ""),
          String(s.toleranceMinus || "")
        );
        return {
          item: idx + 1,
          balloonLabel: formatBalloonLabel(idx + 1, style.padZero),
          dimension: String(s.dimension || ""),
          tolerancePlus: String(s.tolerancePlus || ""),
          toleranceMinus: String(s.toleranceMinus || ""),
          upperLimit: lim.upperLimit,
          lowerLimit: lim.lowerLimit,
          cavity: String(s.cavity || "1"),
          testQuantity: Number(s.testQuantity) || sampleQtyNumber,
          balloonPosition: s.balloonPosition ? { ...s.balloonPosition } : null,
        };
      })
    : [];

  const page4: Page4Data = {
    organization: String(obj.page4.organization || "KST"),
    inspectionDivision: String(obj.page4.inspectionDivision || "QC"),
    partNumber: itemNo,
    partName: String(obj.page4.partName || ""),
    levelRecordOfDesignChange: String(obj.page4.levelRecordOfDesignChange || "N/A"),
    documentOfEngineeringChange: String(obj.page4.documentOfEngineeringChange || "N/A"),
    specifications: specs,
  };

  const rawImg = obj.page3.balloonedDrawingImageBase64;
  const imageBase64 =
    typeof rawImg === "string" && rawImg.startsWith("data:image") ? rawImg : null;

  return {
    page3,
    page4,
    balloonStyle: style,
    generalTolerance: obj.meta?.generalTolerance || createDefaultGeneralTolerance(),
    cropRect: obj.meta?.cropRect ?? null,
    notes: String(obj.meta?.notes || ""),
    imageBase64,
  };
}
