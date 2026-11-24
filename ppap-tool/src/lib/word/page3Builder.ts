import {
  AlignmentType,
  BorderStyle,
  ImageRun,
  Paragraph,
  Table,
  TableCell,
  TableRow,
  TextRun,
  VerticalAlign,
  WidthType,
} from "docx";
import type { TransferJsonPage3 } from "@/types/ppap";
import { decodeDataUrlImage, fitImageSize } from "./imageMeta";

const FONT_ZH = "Microsoft JhengHei";
const BLACK_BORDER = { style: BorderStyle.SINGLE, size: 6, color: "000000" };
const TABLE_BORDERS = {
  top: BLACK_BORDER,
  bottom: BLACK_BORDER,
  left: BLACK_BORDER,
  right: BLACK_BORDER,
  insideHorizontal: BLACK_BORDER,
  insideVertical: BLACK_BORDER,
};
const CELL_MARGIN = { top: 70, bottom: 70, left: 110, right: 110 };

function makeCell(
  lines: string[],
  widthDxa: number,
  options?: { columnSpan?: number; align?: (typeof AlignmentType)[keyof typeof AlignmentType] }
): TableCell {
  const safeLines = lines.length > 0 ? lines : [""];
  return new TableCell({
    width: { size: widthDxa, type: WidthType.DXA },
    columnSpan: options?.columnSpan,
    verticalAlign: VerticalAlign.CENTER,
    margins: CELL_MARGIN,
    children: safeLines.map(
      (line) =>
        new Paragraph({
          alignment: options?.align || AlignmentType.LEFT,
          spacing: { before: 15, after: 15 },
          children: [new TextRun({ text: line, size: 20, font: FONT_ZH, color: "000000" })],
        })
    ),
  });
}

/**
 * 建立 A4 直式 PAGE 3：測試日期、6 列量測資訊表頭與合成球標工程圖
 */
export function buildPage3Elements(page3: TransferJsonPage3): Array<Paragraph | Table> {
  const elements: Array<Paragraph | Table> = [];

  elements.push(
    new Paragraph({
      spacing: { before: 40, after: 80 },
      children: [
        new TextRun({
          text: "測試日期(Test Date)：",
          size: 20,
          font: FONT_ZH,
          color: "000000",
        }),
      ],
    })
  );

  const equipLines =
    page3.testEquipment.length > 0 ? page3.testEquipment : ["游標卡尺 Caliper : S200-01 內-031"];

  const headerTable = new Table({
    width: { size: 10092, type: WidthType.DXA },
    borders: TABLE_BORDERS,
    rows: [
      new TableRow({
        children: [
          makeCell(["測試項目(Test Items)"], 3200),
          makeCell([page3.testItems || "1.尺寸量測 Size Measurement"], 6892, { columnSpan: 3 }),
        ],
      }),
      new TableRow({
        children: [
          makeCell(["測試品名(Item No)"], 3200),
          makeCell([page3.itemNo || ""], 2900),
          makeCell(["樣品數(Sample Q'TY)"], 2392),
          makeCell([page3.sampleQty || "5 PCS"], 1600, { align: AlignmentType.CENTER }),
        ],
      }),
      new TableRow({
        children: [
          makeCell(["測試標準/版次/發行日期", "(Test standards/ Rev./ Date)"], 3200),
          makeCell([page3.combinedStandardRevDate || ""], 6892, { columnSpan: 3 }),
        ],
      }),
      new TableRow({
        children: [
          makeCell(["試驗條件(Test Conditions)"], 3200),
          makeCell([page3.testConditions || "無"], 6892, { columnSpan: 3 }),
        ],
      }),
      new TableRow({
        children: [
          makeCell(["判定標準(Judgement standard)"], 3200),
          makeCell([page3.judgementStandard || ""], 6892, { columnSpan: 3 }),
        ],
      }),
      new TableRow({
        children: [
          makeCell(["測試儀器(Test Equipment)"], 3200),
          makeCell(equipLines, 6892, { columnSpan: 3 }),
        ],
      }),
    ],
  });

  elements.push(headerTable);

  const decoded = decodeDataUrlImage(page3.balloonedDrawingImageBase64);
  if (decoded) {
    const fitted = fitImageSize(decoded.width, decoded.height, 560, 405);
    elements.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { before: 180, after: 0 },
        children: [
          new ImageRun({
            type: decoded.type,
            data: decoded.buffer,
            transformation: { width: fitted.width, height: fitted.height },
          }),
        ],
      })
    );
  } else {
    elements.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { before: 400, after: 0 },
        children: [
          new TextRun({
            text: "（尚未附上工程圖紙）",
            size: 20,
            font: FONT_ZH,
            color: "888888",
          }),
        ],
      })
    );
  }

  return elements;
}
