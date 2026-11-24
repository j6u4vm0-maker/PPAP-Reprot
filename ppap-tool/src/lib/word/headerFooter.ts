import {
  AlignmentType,
  BorderStyle,
  Footer,
  Header,
  ImageRun,
  PageNumber,
  Paragraph,
  Table,
  TableCell,
  TableRow,
  TextRun,
  VerticalAlign,
  WidthType,
} from "docx";

const FONT_ZH = "Microsoft JhengHei";
const FONT_EN = "Arial";
const NO_BORDER = { style: BorderStyle.NONE, size: 0, color: "FFFFFF" };
const NO_BORDERS = {
  top: NO_BORDER,
  bottom: NO_BORDER,
  left: NO_BORDER,
  right: NO_BORDER,
  insideHorizontal: NO_BORDER,
  insideVertical: NO_BORDER,
};

/**
 * 建立與 KST 範例檔一致之頁首（KST Logo + 試驗報告 Test Report + 報告編號 + 頁碼）
 */
export function buildKstHeader(logoBuffer: Buffer | null): Header {
  const logoRuns: Array<ImageRun | TextRun> = logoBuffer
    ? [
        new ImageRun({
          type: "jpg",
          data: logoBuffer,
          transformation: { width: 92, height: 39 },
        }),
      ]
    : [new TextRun({ text: "KST®", bold: true, size: 44, font: FONT_EN, color: "666666" })];

  const titleTable = new Table({
    width: { size: 10092, type: WidthType.DXA },
    borders: NO_BORDERS,
    rows: [
      new TableRow({
        children: [
          new TableCell({
            width: { size: 3600, type: WidthType.DXA },
            verticalAlign: VerticalAlign.CENTER,
            children: [
              new Paragraph({
                alignment: AlignmentType.RIGHT,
                spacing: { after: 0 },
                children: logoRuns,
              }),
            ],
          }),
          new TableCell({
            width: { size: 6492, type: WidthType.DXA },
            verticalAlign: VerticalAlign.CENTER,
            children: [
              new Paragraph({
                alignment: AlignmentType.LEFT,
                indent: { left: 260 },
                spacing: { after: 20 },
                children: [
                  new TextRun({
                    text: "試 驗 報 告",
                    bold: true,
                    size: 36,
                    font: FONT_ZH,
                    color: "666666",
                  }),
                ],
              }),
              new Paragraph({
                alignment: AlignmentType.LEFT,
                indent: { left: 220 },
                spacing: { after: 0 },
                children: [
                  new TextRun({
                    text: "Test Report",
                    bold: true,
                    size: 32,
                    font: FONT_EN,
                    color: "666666",
                  }),
                ],
              }),
            ],
          }),
        ],
      }),
    ],
  });

  const infoTable = new Table({
    width: { size: 10092, type: WidthType.DXA },
    borders: NO_BORDERS,
    rows: [
      new TableRow({
        children: [
          new TableCell({
            width: { size: 5800, type: WidthType.DXA },
            children: [
              new Paragraph({
                spacing: { before: 80, after: 40 },
                children: [
                  new TextRun({
                    text: "報告編號(Report No)：",
                    size: 20,
                    font: FONT_ZH,
                    color: "555555",
                  }),
                ],
              }),
            ],
          }),
          new TableCell({
            width: { size: 4292, type: WidthType.DXA },
            children: [
              new Paragraph({
                alignment: AlignmentType.RIGHT,
                spacing: { before: 80, after: 40 },
                children: [
                  new TextRun({ text: "SRU-13-030-006F   Page ", size: 16, font: FONT_EN, color: "666666" }),
                  new TextRun({ children: [PageNumber.CURRENT], size: 16, font: FONT_EN, color: "666666" }),
                  new TextRun({ text: " of ", size: 16, font: FONT_EN, color: "666666" }),
                  new TextRun({ children: [PageNumber.TOTAL_PAGES], size: 16, font: FONT_EN, color: "666666" }),
                ],
              }),
            ],
          }),
        ],
      }),
    ],
  });

  return new Header({ children: [titleTable, infoTable] });
}

/**
 * 建立與 KST 範例檔一致之頁尾（實驗室地址、電話與中英文責任聲明）
 */
export function buildKstFooter(): Footer {
  return new Footer({
    children: [
      new Paragraph({
        border: { top: { style: BorderStyle.SINGLE, size: 6, color: "888888" } },
        spacing: { before: 60, after: 20 },
        children: [
          new TextRun({
            text: "實驗室名稱:健和興端子股份有限公司 K.S. TERMINALS INC.    電話TEL:(04)758-0001",
            size: 15,
            font: FONT_ZH,
            color: "444444",
          }),
        ],
      }),
      new Paragraph({
        spacing: { after: 20 },
        children: [
          new TextRun({
            text: "實驗室地址：彰化縣線西鄉彰濱工業區東三路13號。No. 13, Zhangbin E. 3rd Road, Xianxi Township, Changhua County 507, Taiwan",
            size: 14,
            font: FONT_ZH,
            color: "444444",
          }),
        ],
      }),
      new Paragraph({
        spacing: { after: 15 },
        children: [
          new TextRun({
            text: "報告僅針對提供之測試物所執行之結果及執行過程之客觀性負絕對之測試責任，未獲得本實驗室同意此試驗報告不得摘錄複製但全文複製除外。",
            size: 13,
            font: FONT_ZH,
            color: "555555",
          }),
        ],
      }),
      new Paragraph({
        spacing: { after: 0 },
        children: [
          new TextRun({
            text: "This report is only applied for item listed above and absolutely process in objective way and the report is not allowed to partially copy without approval of KST Laboratory, except the copy of whole report.",
            size: 13,
            font: FONT_EN,
            color: "555555",
          }),
        ],
      }),
    ],
  });
}
