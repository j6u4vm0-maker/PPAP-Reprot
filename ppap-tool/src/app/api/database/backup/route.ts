import fs from "fs";
import path from "path";
import { NextResponse } from "next/server";
import { loadDatabase } from "@/lib/dbStore";
import { getAppConfig } from "@/lib/env";
import type { DatabaseBackupPayload } from "@/types/ppap";

export const dynamic = "force-dynamic";

export async function GET(): Promise<NextResponse> {
  try {
    const db = loadDatabase();
    const { filesDir } = getAppConfig();
    const filesMap: Record<string, string> = {};

    for (const drawing of db.drawings) {
      const candidates = [drawing.sourceFile, drawing.compositeImageFile];
      for (const fname of candidates) {
        if (!fname || filesMap[fname]) continue;
        const safePath = path.join(filesDir, path.basename(fname));
        if (fs.existsSync(safePath)) {
          filesMap[fname] = fs.readFileSync(safePath).toString("base64");
        }
      }
    }

    const payload: DatabaseBackupPayload = {
      backupVersion: "2.0",
      exportedAt: new Date().toISOString(),
      database: db,
      files: filesMap,
    };

    return NextResponse.json(payload);
  } catch (err) {
    const message = err instanceof Error ? err.message : "匯出資料庫備份失敗";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
