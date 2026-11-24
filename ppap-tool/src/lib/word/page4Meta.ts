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
import type { Page4Data } from "@/types/ppap";

const FONT_EN = "Arial";
const BLACK_BORDER = { style: BorderStyle.SINGLE, size: 6, color: "000000" };
const LEFT_5_W = 4800;
const RIGHT_4_W = 5292;

/**
 * 建立 P4 主表的標題列（KST Logo + PPAP Dimension Measurement Report）與右上料號資訊列
 */
export function buildPage4HeaderRows(
  page4: Page4Data,
  logoBuffer: Buffer | null
): [TableRow, TableRow, TableRow] {
  const titleChildren: Array<ImageRun | TextRun> = logoBuffer
    ? [
        new ImageRun({ type: "jpg", data: logoBuffer, transformation: { width: 76, height: 32 } }),
        new TextRun({ text: "    ", size: 32, font: FONT_EN }),
      ]
    : [new TextRun({ text: "KST  ", bold: true, size: 36, font: FONT_EN })];

  titleChildren.push(
    new TextRun({
      text: "PPAP Dimension Measurement Report",
      size: 32,
      font: FONT_EN,
      color: "000000",
    })
  );

  const titleRow = new TableRow({
    children: [
      new TableCell({
        width: { size: 10092, type: WidthType.DXA },
        columnSpan: 9,
        verticalAlign: VerticalAlign.CENTER,
        margins: { top: 90, bottom: 90, left: 160, right: 120 },
        children: [new Paragraph({ spacing: { after: 0 }, children: titleChildren })],
      }),
    ],
  });

  const partNameLines = (page4.partName || "").split(/\r?\n/).filter(Boolean);
  const rightMetaParagraphs: Paragraph[] = [
    new Paragraph({
      spacing: { after: 40 },
      children: [new TextRun({ text: `Part/Component No.:   ${page4.partNumber || ""}`, size: 19, font: FONT_EN })],
    }),
    new Paragraph({
      spacing: { after: 20 },
      children: [new TextRun({ text: "Part/Component name:", size: 19, font: FONT_EN })],
    }),
    ...(partNameLines.length > 0 ? partNameLines : [""]).map(
      (ln) => new Paragraph({ spacing: { after: 30 }, children: [new TextRun({ text: ln, size: 19, font: FONT_EN })] })
    ),
    new Paragraph({
      spacing: { after: 30 },
      children: [
        new TextRun({
          text: `Level record of design change:  ${page4.levelRecordOfDesignChange || "N/A"}`,
          size: 19,
          font: FONT_EN,
        }),
      ],
    }),
    new Paragraph({
      spacing: { after: 0 },
      children: [
        new TextRun({
          text: `Document of engineering change: ${page4.documentOfEngineeringChange || "N/A"}`,
          size: 19,
          font: FONT_EN,
        }),
      ],
    }),
  ];

  const metaRow1 = new TableRow({
    children: [
      new TableCell({
        width: { size: LEFT_5_W, type: WidthType.DXA },
        columnSpan: 5,
        verticalAlign: VerticalAlign.CENTER,
        margins: { top: 60, bottom: 60, left: 100, right: 80 },
        children: [
          new Paragraph({
            children: [
              new TextRun({
                text: `Organization/Supplier No.:${page4.organization || "KST"}`,
                size: 19,
                font: FONT_EN,
              }),
            ],
          }),
        ],
      }),
      new TableCell({
        width: { size: RIGHT_4_W, type: WidthType.DXA },
        columnSpan: 4,
        rowSpan: 2,
        verticalAlign: VerticalAlign.TOP,
        margins: { top: 60, bottom: 60, left: 100, right: 80 },
        children: rightMetaParagraphs,
      }),
    ],
  });

  const metaRow2 = new TableRow({
    children: [
      new TableCell({
        width: { size: LEFT_5_W, type: WidthType.DXA },
        columnSpan: 5,
        verticalAlign: VerticalAlign.TOP,
        margins: { top: 60, bottom: 60, left: 100, right: 80 },
        children: [
          new Paragraph({
            children: [
              new TextRun({
                text: `Inspection division: ${page4.inspectionDivision || "QC"}`,
                size: 19,
                font: FONT_EN,
              }),
            ],
          }),
        ],
      }),
    ],
  });

  return [titleRow, metaRow1, metaRow2];
}

/**
 * 建立 P4 右下角簽核欄表格（Signature / Title / Date）
 */
export function buildPage4SignatureTable(inspectionDivision: string): Table {
  return new Table({
    alignment: AlignmentType.RIGHT,
    width: { size: 6400, type: WidthType.DXA },
    borders: {
      top: BLACK_BORDER,
      bottom: BLACK_BORDER,
      left: BLACK_BORDER,
      right: BLACK_BORDER,
      insideHorizontal: BLACK_BORDER,
      insideVertical: BLACK_BORDER,
    },
    rows: [
      new TableRow({
        children: [
          new TableCell({
            width: { size: 6400, type: WidthType.DXA },
            margins: { top: 60, bottom: 60, left: 140, right: 140 },
            children: [
              new Paragraph({
                spacing: { after: 0 },
                children: [
                  new TextRun({
                    text: `Signature:                 Title: ${inspectionDivision || "QC"}            Date:               `,
                    size: 19,
                    font: FONT_EN,
                    color: "000000",
                  }),
                ],
              }),
            ],
          }),
        ],
      }),
    ],
  });
}
