import crypto from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { isFileReferencedByOthers, loadDatabase, saveDatabase } from "@/lib/dbStore";
import { safeDeleteFile, saveBase64File } from "@/lib/fileStore";
import { normalizeRotation } from "@/utils/geometry";
import type { BalloonStyle, DrawingRecord, SaveDrawingPayload } from "@/types/ppap";

export const dynamic = "force-dynamic";

const DEFAULT_BALLOON_STYLE: BalloonStyle = {
  preset: "classic",
  radius: 16,
  bgColor: "#111827",
  textColor: "#ffffff",
  borderColor: "#ffffff",
  padZero: true,
};

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const query = (request.nextUrl.searchParams.get("q") || "").trim().toLowerCase();
    const db = loadDatabase();

    const filtered = query
      ? db.drawings.filter((d) => {
          const haystack = [
            d.partNo,
            d.page3?.itemNo,
            d.page3?.testStandard,
            d.page3?.revision,
            d.page4?.partName,
            d.notes,
          ]
            .filter(Boolean)
            .join(" ")
            .toLowerCase();
          return haystack.includes(query);
        })
      : db.drawings;

    const sorted = [...filtered].sort(
      (a, b) => new Date(b.updatedAt || 0).getTime() - new Date(a.updatedAt || 0).getTime()
    );

    return NextResponse.json({ drawings: sorted });
  } catch (err) {
    const message = err instanceof Error ? err.message : "讀取圖紙清單失敗";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = (await request.json()) as SaveDrawingPayload;
    const partNo = (body.partNo || body.page3?.itemNo || "").trim();
    if (!partNo) {
      return NextResponse.json({ error: "請填寫料號 (Item No / Part No.)" }, { status: 400 });
    }

    const db = loadDatabase();
    const now = new Date().toISOString();
    const existingIdx = body.id ? db.drawings.findIndex((d) => d.id === body.id) : -1;
    const existing = existingIdx >= 0 ? db.drawings[existingIdx] : null;
    const id = existing
      ? existing.id
      : `drw_${Date.now()}_${crypto.randomBytes(3).toString("hex")}`;

    let sourceFile = existing ? existing.sourceFile : null;
    let sourceFileName = body.sourceFileName ?? (existing ? existing.sourceFileName : "");
    let sourceFileType = body.sourceFileType ?? (existing ? existing.sourceFileType : "");

    if (body.sourceFileBase64) {
      const ext = sourceFileType === "pdf" ? "pdf" : "png";
      const savedName = saveBase64File(body.sourceFileBase64, `${partNo}_src`, ext);
      if (sourceFile && sourceFile !== savedName && !isFileReferencedByOthers(db, sourceFile, id)) {
        safeDeleteFile(sourceFile);
      }
      sourceFile = savedName;
    } else if (body.clearSourceFile) {
      if (sourceFile && !isFileReferencedByOthers(db, sourceFile, id)) {
        safeDeleteFile(sourceFile);
      }
      sourceFile = null;
      sourceFileName = "";
      sourceFileType = "";
    }

    let compositeImageFile = existing ? existing.compositeImageFile : null;
    if (body.clearSourceFile) {
      if (compositeImageFile && !isFileReferencedByOthers(db, compositeImageFile, id)) {
        safeDeleteFile(compositeImageFile);
      }
      compositeImageFile = null;
    } else if (body.compositeImageBase64) {
      const savedComp = saveBase64File(body.compositeImageBase64, `${partNo}_balloon`, "png");
      if (
        compositeImageFile &&
        compositeImageFile !== savedComp &&
        !isFileReferencedByOthers(db, compositeImageFile, id)
      ) {
        safeDeleteFile(compositeImageFile);
      }
      compositeImageFile = savedComp;
    }

    const record: DrawingRecord = {
      id,
      partNo,
      createdAt: existing ? existing.createdAt : now,
      updatedAt: now,
      sourceFile,
      sourceFileName,
      sourceFileType,
      pdfPage: Number(body.pdfPage) || 1,
      rotation: normalizeRotation(body.rotation),
      compositeImageFile,
      cropRect: body.cropRect ?? null,
      balloonStyle: body.balloonStyle || DEFAULT_BALLOON_STYLE,
      generalTolerance: body.generalTolerance,
      page3: body.page3,
      page4: body.page4,
      notes: body.notes ?? "",
    };

    if (existingIdx >= 0) {
      db.drawings[existingIdx] = record;
    } else {
      db.drawings.unshift(record);
    }

    saveDatabase(db);
    return NextResponse.json({ ok: true, drawing: record });
  } catch (err) {
    const message = err instanceof Error ? err.message : "儲存圖紙失敗";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
