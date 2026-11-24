import fs from "fs";
import path from "path";
import { NextRequest, NextResponse } from "next/server";
import { getAppConfig } from "@/lib/env";
import { getMimeByFilename } from "@/lib/fileStore";

export const dynamic = "force-dynamic";

interface RouteContext {
  params: { filename: string };
}

const ALLOWED_PDFJS_FILES = new Set(["pdf.min.mjs", "pdf.worker.min.mjs"]);

/**
 * 提供離線版 pdfjs-dist 靜態腳本，不需依賴外部 CDN
 */
export async function GET(_request: NextRequest, context: RouteContext): Promise<NextResponse> {
  try {
    const safeName = path.basename(context.params.filename);
    if (!ALLOWED_PDFJS_FILES.has(safeName)) {
      return NextResponse.json({ error: "不允許存取此檔案" }, { status: 403 });
    }

    const { pdfJsBuildDir } = getAppConfig();
    const fullPath = path.join(pdfJsBuildDir, safeName);
    if (!fs.existsSync(fullPath)) {
      return NextResponse.json({ error: "找不到本地 PDF.js 套件檔" }, { status: 404 });
    }

    const content = fs.readFileSync(fullPath);
    return new NextResponse(new Uint8Array(content), {
      status: 200,
      headers: {
        "Content-Type": getMimeByFilename(safeName),
        "Cache-Control": "public, max-age=86400",
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "讀取 PDF.js 失敗";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
