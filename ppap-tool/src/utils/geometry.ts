import type { BalloonPosition, CropRect } from "@/types/ppap";

/**
 * 將角度正規化為 0 / 90 / 180 / 270
 */
export function normalizeRotation(deg: number | undefined): number {
  const n = Number(deg) || 0;
  const snapped = Math.round(n / 90) * 90;
  return ((snapped % 360) + 360) % 360;
}

/**
 * 將單一球標百分比座標順時針旋轉 90 度：(x, y) -> (100 - y, x)
 */
export function rotatePosition90CW(pos: BalloonPosition): BalloonPosition {
  return {
    xPercent: Number((100 - pos.yPercent).toFixed(2)),
    yPercent: Number(pos.xPercent.toFixed(2)),
  };
}

/**
 * 將 P3 裁切矩形百分比座標順時針旋轉 90 度
 */
export function rotateCropRect90CW(rect: CropRect): CropRect {
  return {
    xPercent: Number(Math.max(0, 100 - (rect.yPercent + rect.hPercent)).toFixed(2)),
    yPercent: Number(rect.xPercent.toFixed(2)),
    wPercent: Number(rect.hPercent.toFixed(2)),
    hPercent: Number(rect.wPercent.toFixed(2)),
  };
}
