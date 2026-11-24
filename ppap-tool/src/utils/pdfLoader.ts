export interface PdfViewport {
  width: number;
  height: number;
}

export interface PdfPageProxy {
  rotate?: number;
  getViewport: (options: { scale: number; rotation?: number }) => PdfViewport;
  render: (options: {
    canvasContext: CanvasRenderingContext2D;
    viewport: PdfViewport;
  }) => { promise: Promise<void> };
}

export interface PdfDocumentProxy {
  numPages: number;
  getPage: (pageNum: number) => Promise<PdfPageProxy>;
}

export interface PdfJsModule {
  GlobalWorkerOptions: { workerSrc: string };
  getDocument: (src: string | { data: Uint8Array }) => { promise: Promise<PdfDocumentProxy> };
}

const PDFJS_RENDER_SCALE = 2.0;

/**
 * 動態載入本地離線 PDF.js，失敗時自動降級至 CDN
 */
export async function loadPdfJsModule(hasLocalPdfJs: boolean): Promise<PdfJsModule> {
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const sources: Array<{ lib: string; worker: string }> = [];
  if (hasLocalPdfJs) {
    sources.push({
      lib: `${origin}/api/vendor/pdfjs/pdf.min.mjs`,
      worker: `${origin}/api/vendor/pdfjs/pdf.worker.min.mjs`,
    });
  }
  sources.push({
    lib: "https://cdn.jsdelivr.net/npm/pdfjs-dist@4.10.38/build/pdf.min.mjs",
    worker: "https://cdn.jsdelivr.net/npm/pdfjs-dist@4.10.38/build/pdf.worker.min.mjs",
  });

  for (const src of sources) {
    try {
      const mod = (await import(/* webpackIgnore: true */ src.lib)) as PdfJsModule;
      mod.GlobalWorkerOptions.workerSrc = src.worker;
      return mod;
    } catch (err) {
      console.warn("嘗試載入 PDF.js 失敗:", src.lib, err);
    }
  }
  throw new Error("無法載入 PDF.js 解析引擎");
}

/**
 * 將 PDF 指定頁高解析繪製到目標 Canvas
 */
export async function renderPdfPageToCanvas(
  doc: PdfDocumentProxy,
  pageNum: number,
  rotation: number,
  targetCanvas: HTMLCanvasElement
): Promise<void> {
  const page = await doc.getPage(pageNum);
  const effectiveRotation = (((page.rotate || 0) + rotation) % 360 + 360) % 360;
  const vp = page.getViewport({ scale: PDFJS_RENDER_SCALE, rotation: effectiveRotation });
  targetCanvas.width = Math.round(vp.width);
  targetCanvas.height = Math.round(vp.height);
  const ctx = targetCanvas.getContext("2d");
  if (!ctx) return;
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, targetCanvas.width, targetCanvas.height);
  await page.render({ canvasContext: ctx, viewport: vp }).promise;
}

/**
 * 將圖片 URL 或 DataURL 依旋轉角度繪製到目標 Canvas
 */
export async function renderImageToCanvas(
  src: string,
  rotation: number,
  targetCanvas: HTMLCanvasElement
): Promise<void> {
  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.crossOrigin = "anonymous";
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("圖片載入失敗"));
    image.src = src;
  });

  const swap = rotation % 180 !== 0;
  const w = swap ? img.naturalHeight : img.naturalWidth;
  const h = swap ? img.naturalWidth : img.naturalHeight;
  targetCanvas.width = w;
  targetCanvas.height = h;
  const ctx = targetCanvas.getContext("2d");
  if (!ctx) return;

  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, w, h);
  ctx.save();
  ctx.translate(w / 2, h / 2);
  ctx.rotate((rotation * Math.PI) / 180);
  ctx.drawImage(img, -img.naturalWidth / 2, -img.naturalHeight / 2);
  ctx.restore();
}

/**
 * 將 DataURL 轉換為 Uint8Array 供 PDF.js 讀取
 */
export function dataUrlToBytes(dataUrl: string): Uint8Array {
  const b64 = dataUrl.split(",")[1] || "";
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

/**
 * 將 File 或 Blob 讀取為 Base64 DataURL
 */
export function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(new Error("檔案讀取失敗"));
    reader.readAsDataURL(blob);
  });
}
