import fs from "fs";
import path from "path";
import { NextRequest, NextResponse } from "next/server";
import { loadDatabase, saveDatabase } from "@/lib/dbStore";
import { ensureFilesDir } from "@/lib/fileStore";
import type { DatabaseBackupPayload } from "@/types/ppap";

export const dynamic = "force-dynamic";

interface RestoreRequestBody extends DatabaseBackupPayload {
  mode?: "merge" | "replace";
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = (await request.json()) as RestoreRequestBody;
    if (!body?.database || !Array.isArray(body.database.drawings)) {
      return NextResponse.json({ error: "備份檔格式不正確，缺少 drawings 陣列" }, { status: 400 });
    }

    const filesDir = ensureFilesDir();
    if (body.files && typeof body.files === "object") {
      for (const [fname, b64] of Object.entries(body.files)) {
        const safeName = path.basename(fname);
        fs.writeFileSync(path.join(filesDir, safeName), Buffer.from(b64, "base64"));
      }
    }

    const currentDb = loadDatabase();
    const targetDb =
      body.mode === "replace"
        ? {
            version: "2.3",
            updatedAt: new Date().toISOString(),
            drawings: [],
            equipmentLibrary: currentDb.equipmentLibrary,
            symbolLibrary: currentDb.symbolLibrary,
            generalToleranceLibrary: currentDb.generalToleranceLibrary,
            partMasterLibrary: currentDb.partMasterLibrary,
          }
        : currentDb;

    let importedCount = 0;
    for (const drawing of body.database.drawings) {
      const idx = targetDb.drawings.findIndex((d) => d.id === drawing.id);
      if (idx >= 0) {
        targetDb.drawings[idx] = drawing;
      } else {
        targetDb.drawings.push(drawing);
      }
      importedCount++;
    }

    if (Array.isArray(body.database.equipmentLibrary)) {
      for (const eq of body.database.equipmentLibrary) {
        const exists = targetDb.equipmentLibrary.some((e) => e.id === eq.id || e.label === eq.label);
        if (!exists) targetDb.equipmentLibrary.push(eq);
      }
    }

    if (Array.isArray(body.database.partMasterLibrary)) {
      for (const pm of body.database.partMasterLibrary) {
        const exists = targetDb.partMasterLibrary.some(
          (p) =>
            p.id === pm.id ||
            (p.partNo === pm.partNo &&
              p.testStandard === pm.testStandard &&
              p.revision === pm.revision)
        );
        if (!exists) targetDb.partMasterLibrary.push(pm);
      }
    }

    saveDatabase(targetDb);
    return NextResponse.json({
      ok: true,
      importedCount,
      totalCount: targetDb.drawings.length,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "還原資料庫備份失敗";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
