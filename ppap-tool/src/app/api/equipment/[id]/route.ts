import { NextRequest, NextResponse } from "next/server";
import { loadDatabase, saveDatabase } from "@/lib/dbStore";

export const dynamic = "force-dynamic";

interface RouteContext {
  params: { id: string };
}

export async function PATCH(request: NextRequest, context: RouteContext): Promise<NextResponse> {
  try {
    const body = (await request.json()) as { label?: string };
    const label = (body.label || "").trim();
    if (!label) {
      return NextResponse.json({ error: "測試儀器名稱不可為空" }, { status: 400 });
    }

    const db = loadDatabase();
    const idx = db.equipmentLibrary.findIndex((item) => item.id === context.params.id);
    if (idx === -1) {
      return NextResponse.json({ error: "找不到此測試儀器項目" }, { status: 404 });
    }

    const updated = {
      ...db.equipmentLibrary[idx],
      label,
      updatedAt: new Date().toISOString(),
    };
    db.equipmentLibrary[idx] = updated;
    saveDatabase(db);
    return NextResponse.json({ ok: true, item: updated });
  } catch (err) {
    const message = err instanceof Error ? err.message : "編輯常用測試儀器失敗";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(_request: NextRequest, context: RouteContext): Promise<NextResponse> {
  try {
    const db = loadDatabase();
    const idx = db.equipmentLibrary.findIndex((item) => item.id === context.params.id);
    if (idx === -1) {
      return NextResponse.json({ error: "找不到此測試儀器項目" }, { status: 404 });
    }

    db.equipmentLibrary.splice(idx, 1);
    saveDatabase(db);
    return NextResponse.json({ ok: true, deletedId: context.params.id });
  } catch (err) {
    const message = err instanceof Error ? err.message : "刪除常用測試儀器失敗";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
