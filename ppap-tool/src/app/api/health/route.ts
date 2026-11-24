import fs from "fs";
import path from "path";
import { NextResponse } from "next/server";
import { loadDatabase } from "@/lib/dbStore";
import { getAppConfig } from "@/lib/env";
import type { HealthResponse } from "@/types/ppap";

export const dynamic = "force-dynamic";

export async function GET(): Promise<NextResponse<HealthResponse | { error: string }>> {
  try {
    const db = loadDatabase();
    const { pdfJsBuildDir } = getAppConfig();
    const hasLocalPdfJs = fs.existsSync(path.join(pdfJsBuildDir, "pdf.min.mjs"));

    return NextResponse.json({
      ok: true,
      drawingCount: db.drawings.length,
      equipmentCount: db.equipmentLibrary.length,
      hasLocalPdfJs,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "健康檢查失敗";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
