import type { Page3Data, Page4Data } from "@/types/ppap";
import { formatBalloonLabel } from "./specFormatter";

export type RequiredFieldKey =
  | "itemNo"
  | "testStandard"
  | "judgementStandard"
  | "sampleQtyNumber";

export interface DrawingValidationResult {
  valid: boolean;
  missingMessages: string[];
  invalidFields: RequiredFieldKey[];
  invalidSpecIndices: number[];
}

/**
 * 存檔前檢查必填欄位與規格表完整性，明確列出缺漏項目供使用者補齊
 */
export function validateDrawingForSave(
  page3: Page3Data,
  page4: Page4Data,
  padZero: boolean
): DrawingValidationResult {
  const missingMessages: string[] = [];
  const invalidFields: RequiredFieldKey[] = [];
  const invalidSpecIndices: number[] = [];

  if (!page3.itemNo.trim()) {
    invalidFields.push("itemNo");
    missingMessages.push("料號 (Item No / Part No.)");
  }

  if (!page3.testStandard.trim()) {
    invalidFields.push("testStandard");
    missingMessages.push("測試標準 / 圖號 (Test Standard)");
  }

  const effectiveJudgement = page3.judgementSyncWithTestStandard
    ? page3.testStandard.trim()
    : page3.judgementStandard.trim();
  if (!effectiveJudgement) {
    invalidFields.push("judgementStandard");
    missingMessages.push("判定標準 (Judgement standard)");
  }

  if (!Number.isFinite(page3.sampleQtyNumber) || page3.sampleQtyNumber < 1) {
    invalidFields.push("sampleQtyNumber");
    missingMessages.push("樣品數 (需大於等於 1)");
  }

  page4.specifications.forEach((spec, idx) => {
    if (!spec.dimension.trim()) {
      invalidSpecIndices.push(idx);
      const label = formatBalloonLabel(spec.item, padZero);
      missingMessages.push(`球標 [${label}] 的基準尺寸 (Dimension)`);
    }
  });

  return {
    valid: missingMessages.length === 0,
    missingMessages,
    invalidFields,
    invalidSpecIndices,
  };
}
