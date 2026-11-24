import { NextRequest, NextResponse } from "next/server";
import { loadDatabase, saveDatabase } from "@/lib/dbStore";
import type { GeneralToleranceRule } from "@/types/ppap";

export const dynamic = "force-dynamic";

interface RouteContext {
  params: { id: string };
}

interface PatchProfileBody {
  name?: string;
  rules?: GeneralToleranceRule[];
}

export async function PATCH(request: NextRequest, context: RouteContext): Promise<NextResponse> {
  try {
    const body = (await request.json()) as PatchProfileBody;
    const db = loadDatabase();
    const idx = db.generalToleranceLibrary.findIndex((p) => p.id === context.params.id);
    if (idx === -1) {
      return NextResponse.json({ error: "找不到此一般公差範本" }, { status: 404 });
    }

    const current = db.generalToleranceLibrary[idx];
    const nextName = body.name !== undefined ? body.name.trim() : current.name;
    const nextRules = Array.isArray(body.rules) ? body.rules : current.rules;

    if (!nextName) {
      return NextResponse.json({ error: "範本名稱不可為空" }, { status: 400 });
    }
    if (nextRules.length === 0) {
      return NextResponse.json({ error: "至少需保留一條公差規則" }, { status: 400 });
    }

    const updated = {
      ...current,
      name: nextName,
      rules: nextRules.map((r, i) => ({
        id: r.id || `rule_${Date.now()}_${i}`,
        minDim: Number(r.minDim) || 0,
        maxDim: r.maxDim === null || r.maxDim === undefined ? null : Number(r.maxDim),
        plus: String(r.plus || "+0.50"),
        minus: String(r.minus || "-0.50"),
      })),
      updatedAt: new Date().toISOString(),
    };

    db.generalToleranceLibrary[idx] = updated;
    saveDatabase(db);
    return NextResponse.json({ ok: true, profile: updated });
  } catch (err) {
    const message = err instanceof Error ? err.message : "編輯一般公差範本失敗";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(_request: NextRequest, context: RouteContext): Promise<NextResponse> {
  try {
    const db = loadDatabase();
    const idx = db.generalToleranceLibrary.findIndex((p) => p.id === context.params.id);
    if (idx === -1) {
      return NextResponse.json({ error: "找不到此一般公差範本" }, { status: 404 });
    }

    db.generalToleranceLibrary.splice(idx, 1);
    saveDatabase(db);
    return NextResponse.json({ ok: true, deletedId: context.params.id });
  } catch (err) {
    const message = err instanceof Error ? err.message : "刪除一般公差範本失敗";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
