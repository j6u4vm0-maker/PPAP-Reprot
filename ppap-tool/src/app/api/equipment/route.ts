import crypto from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { loadDatabase, saveDatabase } from "@/lib/dbStore";
import type { EquipmentItem } from "@/types/ppap";

export const dynamic = "force-dynamic";

export async function GET(): Promise<NextResponse> {
  try {
    const db = loadDatabase();
    return NextResponse.json({ equipment: db.equipmentLibrary });
  } catch (err) {
    const message = err instanceof Error ? err.message : "讀取常用儀器清單失敗";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = (await request.json()) as { label?: string };
    const label = (body.label || "").trim();
    if (!label) {
      return NextResponse.json({ error: "請輸入測試儀器名稱與編號" }, { status: 400 });
    }

    const db = loadDatabase();
    const exists = db.equipmentLibrary.some((item) => item.label === label);
    if (exists) {
      return NextResponse.json({ error: "此測試儀器已存在於清單中" }, { status: 409 });
    }

    const now = new Date().toISOString();
    const created: EquipmentItem = {
      id: `eq_${Date.now()}_${crypto.randomBytes(2).toString("hex")}`,
      label,
      createdAt: now,
      updatedAt: now,
    };

    db.equipmentLibrary.push(created);
    saveDatabase(db);
    return NextResponse.json({ ok: true, item: created });
  } catch (err) {
    const message = err instanceof Error ? err.message : "新增常用測試儀器失敗";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
