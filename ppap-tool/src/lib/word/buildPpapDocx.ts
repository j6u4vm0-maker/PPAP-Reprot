import { Document, PageOrientation, Packer } from "docx";
import type { TransferJsonPayload } from "@/types/ppap";
import { loadKstLogoBuffer } from "./imageMeta";
import { buildKstFooter, buildKstHeader } from "./headerFooter";
import { buildPage3Elements } from "./page3Builder";
import { buildPage4Elements } from "./page4Builder";

/**
 * 組合 KST A4 直式 P3 + P4 Word (.docx) 檔案並回傳 Buffer
 */
export async function buildPpapDocxBuffer(payload: TransferJsonPayload): Promise<Buffer> {
  const logoBuffer = loadKstLogoBuffer();
  const header = buildKstHeader(logoBuffer);
  const footer = buildKstFooter();

  const page3Children = buildPage3Elements(payload.page3);
  const page4Children = buildPage4Elements(payload.page4, logoBuffer);

  const doc = new Document({
    creator: "KST PPAP Dimension Prep Tool",
    title: `PPAP Dimension Report - ${payload.partNo}`,
    sections: [
      {
        properties: {
          page: {
            size: {
              width: 11906, // A4 寬 210mm
              height: 16838, // A4 高 297mm
              orientation: PageOrientation.PORTRAIT,
            },
            margin: {
              top: 850,
              bottom: 794,
              left: 907,
              right: 907,
              header: 397,
              footer: 340,
            },
          },
        },
        headers: { default: header },
        footers: { default: footer },
        children: [...page3Children, ...page4Children],
      },
    ],
  });

  return Packer.toBuffer(doc);
}
