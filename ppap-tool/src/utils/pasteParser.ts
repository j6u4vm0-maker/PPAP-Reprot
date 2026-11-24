import type { ParsedSpecRow } from "@/types/ppap";
import {
  formatDecimalString,
  formatToleranceString,
  getUnilateralType,
  parseSingleSpecFormula,
} from "./specFormatter";

const HEADER_REGEX =
  /(^item\.?$|dimension|specification|tolerance|cavity|quantity|measurement|not\s*ok|part\/component)/i;

function isVerticalTripletLayout(lines: string[]): boolean {
  const hasTabs = lines.some((l) => l.includes("\t"));
  if (hasTabs) return false;
  return lines.some(
    (line, i) =>
      i < lines.length - 2 &&
      /^\d+(?:\.\d+)?$/.test(line) &&
      /^\+\d+(?:\.\d+)?$/.test(lines[i + 1]) &&
      /^-\d+(?:\.\d+)?$/.test(lines[i + 2])
  );
}

function parseVerticalLines(lines: string[], defaultQty: number): ParsedSpecRow[] {
  const results: ParsedSpecRow[] = [];
  for (let i = 0; i < lines.length - 2; i++) {
    const isTriplet =
      /^\d+(?:\.\d+)?$/.test(lines[i]) &&
      /^\+\d+(?:\.\d+)?$/.test(lines[i + 1]) &&
      /^-\d+(?:\.\d+)?$/.test(lines[i + 2]);
    if (!isTriplet) continue;

    const cavity = /^\d{1,2}$/.test(lines[i + 3] || "") ? lines[i + 3] : "1";
    const testQuantity = /^\d{1,3}$/.test(lines[i + 4] || "")
      ? Number(lines[i + 4])
      : defaultQty;

    results.push({
      dimension: formatDecimalString(lines[i], 2),
      tolerancePlus: formatToleranceString(lines[i + 1], "+"),
      toleranceMinus: formatToleranceString(lines[i + 2], "-"),
      cavity,
      testQuantity,
    });
    i += 2;
  }
  return results;
}

/**
 * 解析從既有 Word P4 表格或 Excel 複製貼上的規格值，自動過濾實測值與 OK/X 符號
 */
export function parsePastedSpecs(rawText: string, defaultQty: number): ParsedSpecRow[] {
  const normalized = rawText.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  const lines = normalized
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);

  if (lines.length === 0) return [];
  if (isVerticalTripletLayout(lines)) {
    return parseVerticalLines(lines, defaultQty);
  }

  const results: ParsedSpecRow[] = [];

  for (const line of lines) {
    if (HEADER_REGEX.test(line)) continue;

    if (!line.includes("\t") && (/[±+-]/.test(line) || getUnilateralType(line) !== null)) {
      const formula = parseSingleSpecFormula(line);
      if (formula) {
        results.push({
          ...formula,
          cavity: "1",
          testQuantity: defaultQty,
        });
        continue;
      }
    }

    const rawCols = line.includes("\t") ? line.split("\t") : line.split(/\s+/);
    const cols = rawCols.map((c) => c.trim()).filter(Boolean);
    if (cols.length < 2) continue;

    // 遇見實測數據（逗號分隔、GO/NOGO、判定符號）即截斷
    const cleanCols: string[] = [];
    for (const c of cols) {
      if (/,|GO|NOGO|^X$|^OK$|^NG$/i.test(c)) break;
      cleanCols.push(c);
    }
    if (cleanCols.length < 2) continue;

    const col0IsItem =
      /^\d{1,3}$/.test(cleanCols[0]) &&
      cleanCols.length >= 2 &&
      (/^\d+\.\d+$/.test(cleanCols[1]) ||
        getUnilateralType(cleanCols[1]) !== null ||
        /^[+-]?\d+(\.\d+)?$/.test(cleanCols[2] || "") ||
        /±/.test(cleanCols[1]) ||
        /±/.test(cleanCols[2] || ""));
    const offset = col0IsItem ? 1 : 0;

    const cDim = cleanCols[offset] || "";
    const cNext1 = cleanCols[offset + 1] || "";
    const cNext2 = cleanCols[offset + 2] || "";
    const cNext3 = cleanCols[offset + 3] || "";
    const cNext4 = cleanCols[offset + 4] || "";

    if (cDim && getUnilateralType(cDim) !== null) {
      const f = parseSingleSpecFormula(cDim);
      if (f) {
        const trailingNums = cleanCols
          .slice(offset + 1)
          .filter((c) => /^\d{1,3}$/.test(c));
        results.push({
          ...f,
          cavity: trailingNums[0] || "1",
          testQuantity: trailingNums[1] ? Number(trailingNums[1]) : defaultQty,
        });
        continue;
      }
    }

    if (cDim && /^\d+(?:\.\d+)?$/.test(cDim) && /^(?:MAX|MIN)\.?$/i.test(cNext1)) {
      const f = parseSingleSpecFormula(`${cDim} ${cNext1}`);
      if (f) {
        const trailingNums = cleanCols
          .slice(offset + 2)
          .filter((c) => /^\d{1,3}$/.test(c));
        results.push({
          ...f,
          cavity: trailingNums[0] || "1",
          testQuantity: trailingNums[1] ? Number(trailingNums[1]) : defaultQty,
        });
        continue;
      }
    }

    if (cDim && /±|\+\/-/.test(cDim)) {
      const f = parseSingleSpecFormula(cDim);
      if (f) {
        results.push({
          ...f,
          cavity: /^\d+$/.test(cNext1) ? cNext1 : "1",
          testQuantity: /^\d+$/.test(cNext2) ? Number(cNext2) : defaultQty,
        });
        continue;
      }
    }

    if (cDim && /^\d+(\.\d+)?$/.test(cDim) && /^±\s*\d+(\.\d+)?$/.test(cNext1)) {
      const tolVal = cNext1.replace(/^±\s*/, "");
      results.push({
        dimension: formatDecimalString(cDim, 2),
        tolerancePlus: formatToleranceString(tolVal, "+"),
        toleranceMinus: formatToleranceString(tolVal, "-"),
        cavity: /^\d+$/.test(cNext2) ? cNext2 : "1",
        testQuantity: /^\d+$/.test(cNext3) ? Number(cNext3) : defaultQty,
      });
      continue;
    }

    if (
      cDim &&
      /^\d+(\.\d+)?$/.test(cDim) &&
      /^[+-]?\d+(\.\d+)?$/.test(cNext1) &&
      /^[+-]?\d+(\.\d+)?$/.test(cNext2)
    ) {
      results.push({
        dimension: formatDecimalString(cDim, 2),
        tolerancePlus: formatToleranceString(cNext1, "+"),
        toleranceMinus: formatToleranceString(cNext2, "-"),
        cavity: /^\d+$/.test(cNext3) ? cNext3 : "1",
        testQuantity: /^\d+$/.test(cNext4) ? Number(cNext4) : defaultQty,
      });
    }
  }

  return results;
}
