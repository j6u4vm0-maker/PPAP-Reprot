import { NextRequest, NextResponse } from "next/server";
import { loadDatabase, saveDatabase } from "@/lib/dbStore";
import type { SymbolInsertMode } from "@/types/ppap";

export const dynamic = "force-dynamic";

interface RouteContext {
  params: { id: string };
}

interface PatchSymbolBody {
  label?: string;
  value?: string;
  mode?: SymbolInsertMode;
}

const VALID_MODES = new Set<SymbolInsertMode>(["wrap", "prefix", "suffix", "insert"]);

export async function PATCH(request: NextRequest, context: RouteContext): Promise<NextResponse> {
  try {
    const body = (await request.json()) as PatchSymbolBody;
    const db = loadDatabase();
    const idx = db.symbolLibrary.findIndex((s) => s.id === context.params.id);
    if (idx === -1) {
      return NextResponse.json({ error: "找不到此快速符號項目" }, { status: 404 });
    }

    const current = db.symbolLibrary[idx];
    const nextValue = body.value !== undefined ? body.value.trim() : current.value;
    const nextLabel = body.label !== undefined ? body.label.trim() : current.label;
    if (!nextValue || !nextLabel) {
      return NextResponse.json({ error: "符號顯示名稱與內容不可為空" }, { status: 400 });
    }

    const nextMode: SymbolInsertMode =
      body.mode && VALID_MODES.has(body.mode) ? body.mode : current.mode;

    const updated = {
      ...current,
      label: nextLabel,
      value: nextValue,
      mode: nextMode,
      updatedAt: new Date().toISOString(),
    };

    db.symbolLibrary[idx] = updated;
    saveDatabase(db);
    return NextResponse.json({ ok: true, item: updated });
  } catch (err) {
    const message = err instanceof Error ? err.message : "編輯快速符號失敗";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(_request: NextRequest, context: RouteContext): Promise<NextResponse> {
  try {
    const db = loadDatabase();
    const idx = db.symbolLibrary.findIndex((s) => s.id === context.params.id);
    if (idx === -1) {
      return NextResponse.json({ error: "找不到此快速符號項目" }, { status: 404 });
    }

    db.symbolLibrary.splice(idx, 1);
    saveDatabase(db);
    return NextResponse.json({ ok: true, deletedId: context.params.id });
  } catch (err) {
    const message = err instanceof Error ? err.message : "刪除快速符號失敗";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
