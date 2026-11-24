import crypto from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { loadDatabase, saveDatabase } from "@/lib/dbStore";
import type { PartMasterInput, PartMasterItem } from "@/types/ppap";

export const dynamic = "force-dynamic";

interface CreatePartBody extends Partial<PartMasterInput> {
  items?: Array<Partial<PartMasterInput>>;
}

function normalizeInput(raw: Partial<PartMasterInput>): PartMasterInput {
  return {
    partNo: String(raw.partNo ?? "").trim(),
    partName: String(raw.partName ?? "").trim(),
    testStandard: String(raw.testStandard ?? "").trim(),
    revision: String(raw.revision ?? "").trim(),
    issueDate: String(raw.issueDate ?? "").trim(),
  };
}

function isSamePartKey(a: PartMasterInput, b: PartMasterInput): boolean {
  return (
    a.partNo.toLowerCase() === b.partNo.toLowerCase() &&
    a.testStandard.toLowerCase() === b.testStandard.toLowerCase() &&
    a.revision.toLowerCase() === b.revision.toLowerCase()
  );
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const query = (request.nextUrl.searchParams.get("q") || "").trim().toLowerCase();
    const db = loadDatabase();
    const filtered = query
      ? db.partMasterLibrary.filter((p) =>
          [p.partNo, p.partName, p.testStandard, p.revision, p.issueDate]
            .filter(Boolean)
            .join(" ")
            .toLowerCase()
            .includes(query)
        )
      : db.partMasterLibrary;

    return NextResponse.json({ parts: filtered });
  } catch (err) {
    const message = err instanceof Error ? err.message : "讀取料號主檔失敗";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = (await request.json()) as CreatePartBody;
    const db = loadDatabase();
    const now = new Date().toISOString();

    // 支援批次匯入多筆料號主檔
    if (Array.isArray(body.items)) {
      const validRows = body.items
        .map(normalizeInput)
        .filter((r) => Boolean(r.partNo || r.testStandard));
      if (validRows.length === 0) {
        return NextResponse.json({ error: "找不到有效的料號或圖號資料" }, { status: 400 });
      }

      let addedCount = 0;
      let updatedCount = 0;
      for (const row of validRows) {
        const idx = db.partMasterLibrary.findIndex((p) => isSamePartKey(p, row));
        if (idx >= 0) {
          db.partMasterLibrary[idx] = {
            ...db.partMasterLibrary[idx],
            ...row,
            updatedAt: now,
          };
          updatedCount++;
        } else {
          db.partMasterLibrary.unshift({
            id: `pm_${Date.now()}_${crypto.randomBytes(3).toString("hex")}`,
            ...row,
            createdAt: now,
            updatedAt: now,
          });
          addedCount++;
        }
      }

      saveDatabase(db);
      return NextResponse.json({
        ok: true,
        addedCount,
        updatedCount,
        parts: db.partMasterLibrary,
      });
    }

    const input = normalizeInput(body);
    if (!input.partNo && !input.testStandard) {
      return NextResponse.json({ error: "請至少填寫料號或圖號" }, { status: 400 });
    }

    const dupIdx = db.partMasterLibrary.findIndex((p) => isSamePartKey(p, input));
    if (dupIdx >= 0) {
      const updated: PartMasterItem = {
        ...db.partMasterLibrary[dupIdx],
        ...input,
        updatedAt: now,
      };
      db.partMasterLibrary[dupIdx] = updated;
      saveDatabase(db);
      return NextResponse.json({ ok: true, item: updated, replacedExisting: true });
    }

    const created: PartMasterItem = {
      id: `pm_${Date.now()}_${crypto.randomBytes(3).toString("hex")}`,
      ...input,
      createdAt: now,
      updatedAt: now,
    };
    db.partMasterLibrary.unshift(created);
    saveDatabase(db);
    return NextResponse.json({ ok: true, item: created, replacedExisting: false });
  } catch (err) {
    const message = err instanceof Error ? err.message : "新增料號主檔失敗";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
