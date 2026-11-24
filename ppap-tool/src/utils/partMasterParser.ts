import type { PartMasterInput } from "@/types/ppap";

const HEADER_PATTERN = /^(?:料號|item\s*no|part\s*no|品名|產品名稱|圖號|版次|rev|發行日期)/i;

/**
 * 解析從 Excel / CSV / TSV 批次貼上的料號主檔清單
 * 支援格式：
 * - 5 欄：料號 | 品名 | 圖號 | 版次 | 發行日期
 * - 4 欄：料號 | 品名 | 圖號 | 版次
 * - 3 欄：料號 | 圖號 | 版次
 */
export function parsePastedPartMasters(rawText: string): PartMasterInput[] {
  const lines = rawText
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);

  const results: PartMasterInput[] = [];
  for (const line of lines) {
    const rawCols = line.includes("\t")
      ? line.split("\t")
      : line.includes(",")
      ? line.split(",")
      : line.split(/\s{2,}/);
    const cols = rawCols.map((c) => c.trim());
    if (cols.length < 2) continue;
    if (HEADER_PATTERN.test(cols[0])) continue;

    if (cols.length >= 5) {
      results.push({
        partNo: cols[0] || "",
        partName: cols[1] || "",
        testStandard: cols[2] || "",
        revision: cols[3] || "",
        issueDate: cols[4] || "",
      });
      continue;
    }

    if (cols.length === 4) {
      results.push({
        partNo: cols[0] || "",
        partName: cols[1] || "",
        testStandard: cols[2] || "",
        revision: cols[3] || "",
        issueDate: "",
      });
      continue;
    }

    if (cols.length === 3) {
      results.push({
        partNo: cols[0] || "",
        partName: "",
        testStandard: cols[1] || "",
        revision: cols[2] || "",
        issueDate: "",
      });
      continue;
    }

    results.push({
      partNo: cols[0] || "",
      partName: "",
      testStandard: cols[1] || "",
      revision: "",
      issueDate: "",
    });
  }

  return results.filter((r) => Boolean(r.partNo || r.testStandard));
}
