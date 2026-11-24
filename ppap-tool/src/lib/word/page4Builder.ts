import {
  AlignmentType,
  BorderStyle,
  Paragraph,
  Table,
  TableCell,
  TableRow,
  TextRun,
  VerticalAlign,
  WidthType,
} from "docx";
import type { Page4Data } from "@/types/ppap";
import { buildPage4HeaderRows, buildPage4SignatureTable } from "./page4Meta";

const FONT_EN = "Arial";
const FONT_ZH = "Microsoft JhengHei";
const BLACK_BORDER = { style: BorderStyle.SINGLE, size: 6, color: "000000" };
const OUTER_BORDER = { style: BorderStyle.SINGLE, size: 12, color: "000000" };
const TABLE_BORDERS = {
  top: OUTER_BORDER,
  bottom: OUTER_BORDER,
  left: OUTER_BORDER,
  right: OUTER_BORDER,
  insideHorizontal: BLACK_BORDER,
  insideVertical: BLACK_BORDER,
};
const CELL_PAD = { top: 45, bottom: 45, left: 65, right: 65 };

// 9 欄精準寬度（總和 10092 twips = A4 直式可用寬度）
const COL_W = [660, 1460, 960, 960, 760, 900, 3152, 620, 620];

function centerCell(
  lines: string[],
  widthDxa: number,
  options?: { columnSpan?: number; size?: number }
): TableCell {
  return new TableCell({
    width: { size: widthDxa, type: WidthType.DXA },
    columnSpan: options?.columnSpan,
    verticalAlign: VerticalAlign.CENTER,
    margins: CELL_PAD,
    children: lines.map(
      (line) =>
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { before: 10, after: 10 },
          children: [
            new TextRun({
              text: line,
              size: options?.size ?? 19,
              font: FONT_EN,
              color: "000000",
            }),
          ],
        })
    ),
  });
}

/**
 * 建立 A4 直式 PAGE 4：完全比照範例檔 KST PPAP Dimension Measurement Report
 */
export function buildPage4Elements(
  page4: Page4Data,
  logoBuffer: Buffer | null
): Array<Paragraph | Table> {
  const [titleRow, metaRow1, metaRow2] = buildPage4HeaderRows(page4, logoBuffer);

  const specHeaderRow = new TableRow({
    tableHeader: true,
    children: [
      centerCell(["Item."], COL_W[0], { size: 18 }),
      centerCell(["Dimension/", "Specification"], COL_W[1], { size: 18 }),
      centerCell(["Specification/", "Tolerance [+/-]"], COL_W[2] + COL_W[3], {
        columnSpan: 2,
        size: 18,
      }),
      centerCell(["Cavity"], COL_W[4], { size: 18 }),
      centerCell(["Test", "Quantity"], COL_W[5], { size: 18 }),
      centerCell(["Measurement Result", "(Data)"], COL_W[6], { size: 18 }),
      centerCell(["OK"], COL_W[7], { size: 18 }),
      centerCell(["NOT", "OK"], COL_W[8], { size: 18 }),
    ],
  });

  const rowCount = Math.max(15, page4.specifications.length);
  const dataRows: TableRow[] = Array.from({ length: rowCount }).map((_, idx) => {
    const s = page4.specifications[idx];
    return new TableRow({
      children: [
        centerCell([s ? String(s.item) : ""], COL_W[0]),
        centerCell([s ? s.dimension : ""], COL_W[1]),
        centerCell([s ? s.tolerancePlus : ""], COL_W[2]),
        centerCell([s ? s.toleranceMinus : ""], COL_W[3]),
        centerCell([s ? s.cavity : ""], COL_W[4]),
        centerCell([s ? String(s.testQuantity) : ""], COL_W[5]),
        centerCell([""], COL_W[6]),
        centerCell([""], COL_W[7]),
        centerCell([""], COL_W[8]),
      ],
    });
  });

  const mainTable = new Table({
    width: { size: 10092, type: WidthType.DXA },
    borders: TABLE_BORDERS,
    rows: [titleRow, metaRow1, metaRow2, specHeaderRow, ...dataRows],
  });

  return [
    new Paragraph({
      pageBreakBefore: true,
      spacing: { before: 0, after: 80 },
      children: [
        new TextRun({ text: "測試結果(Test Result)", size: 20, font: FONT_ZH, color: "000000" }),
      ],
    }),
    mainTable,
    new Paragraph({ spacing: { before: 80, after: 0 } }),
    buildPage4SignatureTable(page4.inspectionDivision),
  ];
}
