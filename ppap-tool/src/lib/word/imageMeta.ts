import fs from "fs";
import path from "path";

export interface ImageDimensions {
  width: number;
  height: number;
}

export interface DecodedImageData {
  buffer: Buffer;
  type: "png" | "jpg";
  width: number;
  height: number;
}

/**
 * 從 PNG/JPEG Buffer 讀取原始像素寬高（純 TypeScript，無外部相依）
 */
export function readImageDimensions(buf: Buffer): ImageDimensions {
  // PNG: signature 89 50 4E 47, IHDR width@16, height@20 (big-endian)
  if (buf.length >= 24 && buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47) {
    return { width: buf.readUInt32BE(16), height: buf.readUInt32BE(20) };
  }
  // JPEG: scan SOF0/SOF1/SOF2 markers (FF C0 / FF C1 / FF C2)
  if (buf.length >= 4 && buf[0] === 0xff && buf[1] === 0xd8) {
    let offset = 2;
    while (offset + 9 < buf.length) {
      if (buf[offset] !== 0xff) break;
      const marker = buf[offset + 1];
      const segLen = buf.readUInt16BE(offset + 2);
      if (marker === 0xc0 || marker === 0xc1 || marker === 0xc2) {
        return {
          height: buf.readUInt16BE(offset + 5),
          width: buf.readUInt16BE(offset + 7),
        };
      }
      if (segLen < 2) break;
      offset += 2 + segLen;
    }
  }
  return { width: 800, height: 600 };
}

/**
 * 依最大寬高限制等比例縮放圖片尺寸（避免變形與超頁）
 */
export function fitImageSize(
  origWidth: number,
  origHeight: number,
  maxWidth: number,
  maxHeight: number
): ImageDimensions {
  const safeW = Math.max(1, origWidth);
  const safeH = Math.max(1, origHeight);
  const scale = Math.min(maxWidth / safeW, maxHeight / safeH, 1);
  return {
    width: Math.max(20, Math.round(safeW * scale)),
    height: Math.max(20, Math.round(safeH * scale)),
  };
}

/**
 * 解析 Base64 DataURL 為 Buffer 與像素尺寸
 */
export function decodeDataUrlImage(dataUrl: string | null | undefined): DecodedImageData | null {
  if (!dataUrl || typeof dataUrl !== "string") return null;
  const match = dataUrl.match(/^data:image\/(png|jpeg|jpg);base64,([\s\S]+)$/i);
  if (!match) return null;
  const type: "png" | "jpg" = match[1].toLowerCase() === "png" ? "png" : "jpg";
  const buffer = Buffer.from(match[2], "base64");
  const { width, height } = readImageDimensions(buffer);
  return { buffer, type, width, height };
}

/**
 * 讀取內建 KST 原版 Logo 圖檔
 */
export function loadKstLogoBuffer(): Buffer | null {
  const logoPath = path.join(process.cwd(), "assets", "kst_logo.jpg");
  if (!fs.existsSync(logoPath)) return null;
  return fs.readFileSync(logoPath);
}
