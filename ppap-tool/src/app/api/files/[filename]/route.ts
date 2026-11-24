import { NextRequest, NextResponse } from "next/server";
import { readStoredFile } from "@/lib/fileStore";

export const dynamic = "force-dynamic";

interface RouteContext {
  params: { filename: string };
}

export async function GET(_request: NextRequest, context: RouteContext): Promise<NextResponse> {
  try {
    const fileData = readStoredFile(context.params.filename);
    if (!fileData) {
      return NextResponse.json({ error: "找不到圖檔" }, { status: 404 });
    }

    return new NextResponse(new Uint8Array(fileData.buffer), {
      status: 200,
      headers: {
        "Content-Type": fileData.contentType,
        "Content-Length": String(fileData.buffer.length),
        "Cache-Control": "public, max-age=3600",
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "讀取檔案失敗";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
