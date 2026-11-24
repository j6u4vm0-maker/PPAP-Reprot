import fs from "fs";
import path from "path";
import crypto from "crypto";
import { getAppConfig } from "./env";

const MIME_MAP: Record<string, string> = {
  ".pdf": "application/pdf",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".mjs": "application/javascript; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
};

/**
 * 清理檔名避免路徑穿越或非法字元
 */
export function sanitizeFileSegment(raw: string): string {
  return String(raw || "file")
    .replace(/[^a-zA-Z0-9._-]/g, "_")
    .slice(0, 80);
}

/**
 * 確保檔案儲存資料夾存在
 */
export function ensureFilesDir(): string {
  const { filesDir } = getAppConfig();
  fs.mkdirSync(filesDir, { recursive: true });
  return filesDir;
}

/**
 * 將 Base64 DataURL 寫入本地檔案資料夾並回傳安全檔名
 */
export function saveBase64File(
  base64DataUrl: string | null | undefined,
  prefix: string,
  defaultExt: string
): string | null {
  if (!base64DataUrl || typeof base64DataUrl !== "string") {
    return null;
  }

  const filesDir = ensureFilesDir();
  let ext = defaultExt;
  let pureBase64 = base64DataUrl;

  const match = base64DataUrl.match(/^data:([^;]+);base64,([\s\S]+)$/);
  if (match) {
    const mime = match[1].toLowerCase();
    pureBase64 = match[2];
    if (mime.includes("pdf")) ext = "pdf";
    else if (mime.includes("png")) ext = "png";
    else if (mime.includes("jpeg") || mime.includes("jpg")) ext = "jpg";
    else if (mime.includes("webp")) ext = "webp";
  }

  const randomHex = crypto.randomBytes(3).toString("hex");
  const filename = `${sanitizeFileSegment(prefix)}_${Date.now()}_${randomHex}.${ext}`;
  const fullPath = path.join(filesDir, filename);
  fs.writeFileSync(fullPath, Buffer.from(pureBase64, "base64"));
  return filename;
}

/**
 * 安全刪除已儲存的本地圖檔
 */
export function safeDeleteFile(filename: string | null | undefined): void {
  if (!filename) return;
  const { filesDir } = getAppConfig();
  const safeName = path.basename(filename);
  const fullPath = path.join(filesDir, safeName);
  if (!fs.existsSync(fullPath)) return;
  try {
    fs.unlinkSync(fullPath);
  } catch (err) {
    console.error("刪除檔案失敗:", safeName, err);
  }
}

/**
 * 讀取本地圖檔內容與對應 MIME 型別
 */
export function readStoredFile(filename: string): { buffer: Buffer; contentType: string } | null {
  const { filesDir } = getAppConfig();
  const safeName = path.basename(filename);
  const fullPath = path.join(filesDir, safeName);
  if (!fs.existsSync(fullPath) || fs.statSync(fullPath).isDirectory()) {
    return null;
  }
  const ext = path.extname(safeName).toLowerCase();
  return {
    buffer: fs.readFileSync(fullPath),
    contentType: MIME_MAP[ext] || "application/octet-stream",
  };
}

/**
 * 依副檔名取得 Content-Type
 */
export function getMimeByFilename(filename: string): string {
  const ext = path.extname(filename).toLowerCase();
  return MIME_MAP[ext] || "application/octet-stream";
}
