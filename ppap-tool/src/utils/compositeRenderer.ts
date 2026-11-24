import type { BalloonStyle, CropRect, SpecItem } from "@/types/ppap";
import { formatBalloonLabel } from "./specFormatter";

export interface CompositeRenderParams {
  baseCanvas: HTMLCanvasElement;
  displayWidth: number;
  zoom: number;
  specifications: SpecItem[];
  balloonStyle: BalloonStyle;
  cropRect: CropRect | null;
}

/**
 * 將高解析度工程圖與所有球標、裁切範圍合成為 P3 輸出用 PNG DataURL
 */
export function renderCompositeDrawingDataUrl(params: CompositeRenderParams): string | null {
  const { baseCanvas, displayWidth, zoom, specifications, balloonStyle, cropRect } = params;
  const fullW = baseCanvas.width;
  const fullH = baseCanvas.height;
  if (!fullW || !fullH) return null;

  const fullCanvas = document.createElement("canvas");
  fullCanvas.width = fullW;
  fullCanvas.height = fullH;
  const ctx = fullCanvas.getContext("2d");
  if (!ctx) return null;

  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, fullW, fullH);
  ctx.drawImage(baseCanvas, 0, 0);

  const safeDisplayW = displayWidth > 0 ? displayWidth : fullW;
  const displayRadius = Math.max(9, Math.round(balloonStyle.radius * Math.max(0.65, zoom * 1.1)));
  const ratio = fullW / safeDisplayW;
  const actualRadius = Math.max(10, displayRadius * ratio);

  for (const spec of specifications) {
    if (!spec.balloonPosition) continue;
    const cx = (spec.balloonPosition.xPercent / 100) * fullW;
    const cy = (spec.balloonPosition.yPercent / 100) * fullH;
    const label = formatBalloonLabel(spec.item, balloonStyle.padZero);

    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, actualRadius, 0, Math.PI * 2);
    ctx.fillStyle = balloonStyle.bgColor;
    ctx.fill();

    ctx.lineWidth = Math.max(2, actualRadius * 0.14);
    ctx.strokeStyle = balloonStyle.borderColor;
    ctx.stroke();

    ctx.fillStyle = balloonStyle.textColor;
    ctx.font = `800 ${Math.round(actualRadius * 1.05)}px Arial, "Segoe UI", sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(label, cx, cy + actualRadius * 0.04);
    ctx.restore();
  }

  if (cropRect && cropRect.wPercent > 1 && cropRect.hPercent > 1) {
    const sx = Math.round((cropRect.xPercent / 100) * fullW);
    const sy = Math.round((cropRect.yPercent / 100) * fullH);
    const sw = Math.max(10, Math.round((cropRect.wPercent / 100) * fullW));
    const sh = Math.max(10, Math.round((cropRect.hPercent / 100) * fullH));
    const cropped = document.createElement("canvas");
    cropped.width = sw;
    cropped.height = sh;
    const cropCtx = cropped.getContext("2d");
    if (!cropCtx) return fullCanvas.toDataURL("image/png");
    cropCtx.drawImage(fullCanvas, sx, sy, sw, sh, 0, 0, sw, sh);
    return cropped.toDataURL("image/png");
  }

  return fullCanvas.toDataURL("image/png");
}

/**
 * 觸發瀏覽器下載檔案
 */
export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
