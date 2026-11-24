import { NextRequest, NextResponse } from "next/server";
import { buildPpapDocxBuffer } from "@/lib/word/buildPpapDocx";
import type { TransferJsonPayload } from "@/types/ppap";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const payload = (await request.json()) as TransferJsonPayload;
    if (!payload?.page3 || !payload?.page4) {
      return NextResponse.json({ error: "匯出資料缺少 page3 或 page4 內容" }, { status: 400 });
    }

    const buffer = await buildPpapDocxBuffer(payload);
    const safePart = (payload.partNo || payload.page3.itemNo || "PPAP")
      .replace(/[^a-zA-Z0-9._-]/g, "_")
      .slice(0, 60);
    const dateTag = new Date().toISOString().slice(0, 10).replace(/-/g, "");
    const filename = `PPAP_${safePart}_${dateTag}.docx`;

    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "匯出 Word 檔案失敗";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
