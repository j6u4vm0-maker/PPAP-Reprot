import crypto from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { loadDatabase, saveDatabase } from "@/lib/dbStore";
import type { GeneralToleranceProfile, GeneralToleranceRule } from "@/types/ppap";

export const dynamic = "force-dynamic";

interface CreateProfileBody {
  name?: string;
  rules?: GeneralToleranceRule[];
}

export async function GET(): Promise<NextResponse> {
  try {
    const db = loadDatabase();
    return NextResponse.json({ profiles: db.generalToleranceLibrary });
  } catch (err) {
    const message = err instanceof Error ? err.message : "讀取一般公差範本庫失敗";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = (await request.json()) as CreateProfileBody;
    const name = (body.name || "").trim();
    const rules = Array.isArray(body.rules) ? body.rules : [];

    if (!name) {
      return NextResponse.json({ error: "請輸入一般公差範本名稱" }, { status: 400 });
    }
    if (rules.length === 0) {
      return NextResponse.json({ error: "請至少設定一條公差區間規則" }, { status: 400 });
    }

    const db = loadDatabase();
    const now = new Date().toISOString();
    const created: GeneralToleranceProfile = {
      id: `gtol_${Date.now()}_${crypto.randomBytes(2).toString("hex")}`,
      name,
      rules: rules.map((r, idx) => ({
        id: r.id || `rule_${Date.now()}_${idx}`,
        minDim: Number(r.minDim) || 0,
        maxDim: r.maxDim === null || r.maxDim === undefined ? null : Number(r.maxDim),
        plus: String(r.plus || "+0.50"),
        minus: String(r.minus || "-0.50"),
      })),
      createdAt: now,
      updatedAt: now,
    };

    db.generalToleranceLibrary.push(created);
    saveDatabase(db);
    return NextResponse.json({ ok: true, profile: created });
  } catch (err) {
    const message = err instanceof Error ? err.message : "新增一般公差範本失敗";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
