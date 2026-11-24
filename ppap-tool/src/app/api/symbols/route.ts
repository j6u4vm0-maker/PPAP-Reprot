import crypto from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { loadDatabase, saveDatabase } from "@/lib/dbStore";
import type { SymbolInsertMode, SymbolItem } from "@/types/ppap";

export const dynamic = "force-dynamic";

const VALID_MODES = new Set<SymbolInsertMode>(["wrap", "prefix", "suffix", "insert"]);

interface CreateSymbolBody {
  label?: string;
  value?: string;
  mode?: SymbolInsertMode;
}

export async function GET(): Promise<NextResponse> {
  try {
    const db = loadDatabase();
    return NextResponse.json({ symbols: db.symbolLibrary });
  } catch (err) {
    const message = err instanceof Error ? err.message : "讀取快速符號庫失敗";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = (await request.json()) as CreateSymbolBody;
    const value = (body.value || "").trim();
    const label = (body.label || value).trim();
    const mode: SymbolInsertMode = body.mode && VALID_MODES.has(body.mode) ? body.mode : "insert";

    if (!value) {
      return NextResponse.json({ error: "請輸入符號內容" }, { status: 400 });
    }

    const db = loadDatabase();
    const exists = db.symbolLibrary.some((s) => s.value === value && s.mode === mode);
    if (exists) {
      return NextResponse.json({ error: "此快速符號已存在於清單中" }, { status: 409 });
    }

    const now = new Date().toISOString();
    const created: SymbolItem = {
      id: `sym_${Date.now()}_${crypto.randomBytes(2).toString("hex")}`,
      label,
      value,
      mode,
      createdAt: now,
      updatedAt: now,
    };

    db.symbolLibrary.push(created);
    saveDatabase(db);
    return NextResponse.json({ ok: true, item: created });
  } catch (err) {
    const message = err instanceof Error ? err.message : "新增快速符號失敗";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
