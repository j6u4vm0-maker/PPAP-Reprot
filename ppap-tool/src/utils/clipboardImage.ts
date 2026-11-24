/**
 * 產生截圖檔案名稱（例如 screenshot_20261124_231500.png）
 */
function buildScreenshotFilename(mimeType: string): string {
  const now = new Date();
  const pad = (n: number): string => String(n).padStart(2, "0");
  const stamp = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}_${pad(
    now.getHours()
  )}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
  const ext = mimeType.includes("jpeg") || mimeType.includes("jpg")
    ? "jpg"
    : mimeType.includes("webp")
    ? "webp"
    : "png";
  return `screenshot_${stamp}.${ext}`;
}

/**
 * 從瀏覽器 paste 事件的 ClipboardData 擷取圖片檔案（無圖片時回傳 null，不干擾文字貼上）
 */
export function extractImageFileFromClipboardEvent(e: ClipboardEvent): File | null {
  const dt = e.clipboardData;
  if (!dt) return null;

  if (dt.items && dt.items.length > 0) {
    for (let i = 0; i < dt.items.length; i++) {
      const item = dt.items[i];
      if (item.kind === "file" && item.type.startsWith("image/")) {
        const rawFile = item.getAsFile();
        if (!rawFile) continue;
        const name =
          rawFile.name && rawFile.name !== "image.png"
            ? rawFile.name
            : buildScreenshotFilename(rawFile.type || "image/png");
        return new File([rawFile], name, { type: rawFile.type || "image/png" });
      }
    }
  }

  if (dt.files && dt.files.length > 0) {
    for (let i = 0; i < dt.files.length; i++) {
      const file = dt.files[i];
      if (file.type.startsWith("image/")) {
        const name =
          file.name && file.name !== "image.png"
            ? file.name
            : buildScreenshotFilename(file.type || "image/png");
        return new File([file], name, { type: file.type || "image/png" });
      }
    }
  }

  return null;
}

/**
 * 主動透過 Clipboard API 讀取剪貼簿中的圖片（供「📋 貼上截圖」按鈕呼叫）
 */
export async function readImageFileFromNavigatorClipboard(): Promise<File | null> {
  if (typeof navigator === "undefined" || !navigator.clipboard?.read) {
    throw new Error("目前瀏覽器不支援按鈕讀取剪貼簿圖片，請直接按 Ctrl+V 貼上");
  }

  const items = await navigator.clipboard.read();
  for (const item of items) {
    const imageType = item.types.find((t) => t.startsWith("image/"));
    if (!imageType) continue;
    const blob = await item.getType(imageType);
    return new File([blob], buildScreenshotFilename(imageType), { type: imageType });
  }
  return null;
}
