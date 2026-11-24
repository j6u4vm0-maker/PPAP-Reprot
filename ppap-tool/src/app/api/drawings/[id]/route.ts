import { NextRequest, NextResponse } from "next/server";
import { isFileReferencedByOthers, loadDatabase, saveDatabase } from "@/lib/dbStore";
import { safeDeleteFile } from "@/lib/fileStore";
import type { PatchDrawingMetaPayload } from "@/types/ppap";

export const dynamic = "force-dynamic";

interface RouteContext {
  params: { id: string };
}

export async function GET(_request: NextRequest, context: RouteContext): Promise<NextResponse> {
  try {
    const db = loadDatabase();
    const record = db.drawings.find((d) => d.id === context.params.id);
    if (!record) {
      return NextResponse.json({ error: "找不到此圖紙資料" }, { status: 404 });
    }
    return NextResponse.json({ drawing: record });
  } catch (err) {
    const message = err instanceof Error ? err.message : "讀取圖紙資料失敗";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/**
 * 支援從圖紙資料庫清單直接快速編輯料號、測試標準、版次、發行日期、品名與備註
 */
export async function PATCH(request: NextRequest, context: RouteContext): Promise<NextResponse> {
  try {
    const body = (await request.json()) as PatchDrawingMetaPayload;
    const db = loadDatabase();
    const idx = db.drawings.findIndex((d) => d.id === context.params.id);
    if (idx === -1) {
      return NextResponse.json({ error: "找不到此圖紙資料" }, { status: 404 });
    }

    const current = db.drawings[idx];
    const nextPartNo = body.partNo !== undefined ? body.partNo.trim() : current.partNo;
    if (!nextPartNo) {
      return NextResponse.json({ error: "料號不可為空" }, { status: 400 });
    }

    const nextTestStd =
      body.testStandard !== undefined ? body.testStandard.trim() : current.page3.testStandard;
    const nextRev = body.revision !== undefined ? body.revision.trim() : current.page3.revision;
    const nextDate = body.issueDate !== undefined ? body.issueDate.trim() : current.page3.issueDate;
    const nextCombined = [nextTestStd, nextRev, nextDate].filter(Boolean).join("/");
    const nextJudgement = current.page3.judgementSyncWithTestStandard
      ? nextTestStd
      : current.page3.judgementStandard;

    const updated = {
      ...current,
      partNo: nextPartNo,
      updatedAt: new Date().toISOString(),
      notes: body.notes !== undefined ? body.notes.trim() : current.notes,
      page3: {
        ...current.page3,
        itemNo: nextPartNo,
        testStandard: nextTestStd,
        revision: nextRev,
        issueDate: nextDate,
        combinedStandardRevDate: nextCombined,
        judgementStandard: nextJudgement,
      },
      page4: {
        ...current.page4,
        partNumber: nextPartNo,
        partName: body.partName !== undefined ? body.partName.trim() : current.page4.partName,
      },
    };

    db.drawings[idx] = updated;
    saveDatabase(db);
    return NextResponse.json({ ok: true, drawing: updated });
  } catch (err) {
    const message = err instanceof Error ? err.message : "更新圖紙資訊失敗";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(_request: NextRequest, context: RouteContext): Promise<NextResponse> {
  try {
    const db = loadDatabase();
    const idx = db.drawings.findIndex((d) => d.id === context.params.id);
    if (idx === -1) {
      return NextResponse.json({ error: "找不到此圖紙資料" }, { status: 404 });
    }

    const [removed] = db.drawings.splice(idx, 1);
    if (removed.sourceFile && !isFileReferencedByOthers(db, removed.sourceFile)) {
      safeDeleteFile(removed.sourceFile);
    }
    if (removed.compositeImageFile && !isFileReferencedByOthers(db, removed.compositeImageFile)) {
      safeDeleteFile(removed.compositeImageFile);
    }

    saveDatabase(db);
    return NextResponse.json({ ok: true, deletedId: context.params.id });
  } catch (err) {
    const message = err instanceof Error ? err.message : "刪除圖紙失敗";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
