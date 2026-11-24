import type { TransferJsonPayload } from "@/types/ppap";
import { downloadBlob } from "./compositeRenderer";

/** 產生安全檔名（前綴_料號_YYYYMMDD.副檔名） */
export function buildExportFilename(prefix: string, partNo: string, ext: string): string {
  const safePart = (partNo || "PPAP").replace(/[^a-zA-Z0-9._-]/g, "_");
  const dateTag = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  return `${prefix}_${safePart}_${dateTag}.${ext}`;
}

/** 觸發 JSON 檔案下載 */
export function downloadJsonPayload(data: object, filename: string, pretty = false): void {
  const text = pretty ? JSON.stringify(data, null, 2) : JSON.stringify(data);
  downloadBlob(new Blob([text], { type: "application/json;charset=utf-8" }), filename);
}

/** 觸發 DataURL 圖片下載 */
export function downloadDataUrlFile(dataUrl: string, filename: string): void {
  const a = document.createElement("a");
  a.href = dataUrl;
  a.download = filename;
  a.click();
}

/**
 * 呼叫後端 /api/export/word 產生 A4 直式 KST 範例版面 Word (.docx) 並觸發下載
 */
export async function requestWordExport(payload: TransferJsonPayload): Promise<string> {
  const res = await fetch("/api/export/word", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    let errMsg = `匯出 Word 失敗 (HTTP ${res.status})`;
    try {
      const data = (await res.json()) as { error?: string };
      if (data.error) errMsg = data.error;
    } catch {
      // 非 JSON 錯誤回應
    }
    throw new Error(errMsg);
  }

  const blob = await res.blob();
  const filename = buildExportFilename("PPAP", payload.partNo || payload.page3.itemNo, "docx");
  downloadBlob(blob, filename);
  return filename;
}
