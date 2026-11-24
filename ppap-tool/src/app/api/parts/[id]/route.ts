import { NextRequest, NextResponse } from "next/server";
import { loadDatabase, saveDatabase } from "@/lib/dbStore";
import type { PartMasterInput, PartMasterItem } from "@/types/ppap";

export const dynamic = "force-dynamic";

interface RouteContext {
  params: { id: string };
}

export async function PATCH(request: NextRequest, context: RouteContext): Promise<NextResponse> {
  try {
    const body = (await request.json()) as Partial<PartMasterInput>;
    const db = loadDatabase();
    const idx = db.partMasterLibrary.findIndex((p) => p.id === context.params.id);
    if (idx === -1) {
      return NextResponse.json({ error: "找不到此料號主檔項目" }, { status: 404 });
    }

    const current = db.partMasterLibrary[idx];
    const nextPartNo = body.partNo !== undefined ? body.partNo.trim() : current.partNo;
    const nextStd = body.testStandard !== undefined ? body.testStandard.trim() : current.testStandard;
    if (!nextPartNo && !nextStd) {
      return NextResponse.json({ error: "料號與圖號不可同時為空" }, { status: 400 });
    }

    const updated: PartMasterItem = {
      ...current,
      partNo: nextPartNo,
      partName: body.partName !== undefined ? body.partName.trim() : current.partName,
      testStandard: nextStd,
      revision: body.revision !== undefined ? body.revision.trim() : current.revision,
      issueDate: body.issueDate !== undefined ? body.issueDate.trim() : current.issueDate,
      updatedAt: new Date().toISOString(),
    };

    db.partMasterLibrary[idx] = updated;
    saveDatabase(db);
    return NextResponse.json({ ok: true, item: updated });
  } catch (err) {
    const message = err instanceof Error ? err.message : "編輯料號主檔失敗";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(_request: NextRequest, context: RouteContext): Promise<NextResponse> {
  try {
    const db = loadDatabase();
    const idx = db.partMasterLibrary.findIndex((p) => p.id === context.params.id);
    if (idx === -1) {
      return NextResponse.json({ error: "找不到此料號主檔項目" }, { status: 404 });
    }

    db.partMasterLibrary.splice(idx, 1);
    saveDatabase(db);
    return NextResponse.json({ ok: true, deletedId: context.params.id });
  } catch (err) {
    const message = err instanceof Error ? err.message : "刪除料號主檔失敗";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
