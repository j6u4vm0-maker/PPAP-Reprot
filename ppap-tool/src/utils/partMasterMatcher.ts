import type { DrawingRecord, PartMasterItem } from "@/types/ppap";

function norm(val: string | undefined | null): string {
  return String(val ?? "").trim().toLowerCase();
}

/**
 * 依據料號主檔項目，從圖紙資料庫比對最符合的已存檔圖紙紀錄
 * 優先順序：料號+圖號+版次 > 料號+圖號 > 料號 > 圖號
 */
export function findMatchingDrawingForPart(
  part: PartMasterItem,
  drawings: DrawingRecord[]
): DrawingRecord | null {
  const pNo = norm(part.partNo);
  const pStd = norm(part.testStandard);
  const pRev = norm(part.revision);

  if (pNo && pStd && pRev) {
    const exact = drawings.find(
      (d) =>
        norm(d.partNo || d.page3?.itemNo) === pNo &&
        norm(d.page3?.testStandard) === pStd &&
        norm(d.page3?.revision) === pRev
    );
    if (exact) return exact;
  }

  if (pNo && pStd) {
    const byNoStd = drawings.find(
      (d) =>
        norm(d.partNo || d.page3?.itemNo) === pNo &&
        norm(d.page3?.testStandard) === pStd
    );
    if (byNoStd) return byNoStd;
  }

  if (pNo) {
    const byNo = drawings.find((d) => norm(d.partNo || d.page3?.itemNo) === pNo);
    if (byNo) return byNo;
  }

  if (pStd) {
    const byStd = drawings.find((d) => norm(d.page3?.testStandard) === pStd);
    if (byStd) return byStd;
  }

  return null;
}

/**
 * 建立已綁定圖紙紀錄的主檔 ID 集合，供下拉選單與管理視窗標記「📎 已有圖紙」
 */
export function buildLinkedPartIdSet(
  parts: PartMasterItem[],
  drawings: DrawingRecord[]
): Set<string> {
  const ids = new Set<string>();
  for (const part of parts) {
    if (findMatchingDrawingForPart(part, drawings)) {
      ids.add(part.id);
    }
  }
  return ids;
}
