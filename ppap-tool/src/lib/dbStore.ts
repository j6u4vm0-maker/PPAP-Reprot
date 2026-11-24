import fs from "fs";
import { getAppConfig } from "./env";
import { DEFAULT_SYMBOL_LIST } from "./defaultSymbols";
import { DEFAULT_GENERAL_TOLERANCE_PROFILES } from "./defaultTolerances";
import type { DatabaseSchema, DrawingRecord, EquipmentItem, PartMasterItem } from "@/types/ppap";

const DEFAULT_EQUIPMENT_LIST: EquipmentItem[] = [
  {
    id: "eq_caliper_031",
    label: "游標卡尺 Caliper : S200-01 內-031",
    createdAt: "2026-11-24T20:00:00.000Z",
    updatedAt: "2026-11-24T20:00:00.000Z",
  },
  {
    id: "eq_projection_116",
    label: "投影機 Projection : S200-05 外-116",
    createdAt: "2026-11-24T20:00:00.000Z",
    updatedAt: "2026-11-24T20:00:00.000Z",
  },
  {
    id: "eq_pin_d210_002",
    label: "圓棒 Pin Gauge : D210-06 內-002",
    createdAt: "2026-11-24T20:00:00.000Z",
    updatedAt: "2026-11-24T20:00:00.000Z",
  },
  {
    id: "eq_pin_d210_001",
    label: "圓棒 Pin Gauge : D210-06 內-001",
    createdAt: "2026-11-24T20:00:00.000Z",
    updatedAt: "2026-11-24T20:00:00.000Z",
  },
  {
    id: "eq_pin_s200_001",
    label: "圓棒 Pin Gauge : S200-06 內-001",
    createdAt: "2026-11-24T20:00:00.000Z",
    updatedAt: "2026-11-24T20:00:00.000Z",
  },
];

function buildInitialPartMasters(drawings: DrawingRecord[]): PartMasterItem[] {
  const seen = new Set<string>();
  const list: PartMasterItem[] = [];
  for (const d of drawings) {
    const partNo = (d.partNo || d.page3?.itemNo || "").trim();
    const testStandard = (d.page3?.testStandard || "").trim();
    const revision = (d.page3?.revision || "").trim();
    if (!partNo && !testStandard) continue;
    const key = `${partNo.toLowerCase()}|${testStandard.toLowerCase()}|${revision.toLowerCase()}`;
    if (seen.has(key)) continue;
    seen.add(key);
    const now = d.updatedAt || new Date().toISOString();
    list.push({
      id: `pm_seed_${list.length + 1}_${partNo.replace(/[^a-zA-Z0-9]/g, "") || "item"}`,
      partNo,
      partName: (d.page4?.partName || "").trim(),
      testStandard,
      revision,
      issueDate: (d.page3?.issueDate || "").trim(),
      createdAt: d.createdAt || now,
      updatedAt: now,
    });
  }
  return list;
}

function createEmptyDb(): DatabaseSchema {
  return {
    version: "2.3",
    updatedAt: new Date().toISOString(),
    drawings: [],
    equipmentLibrary: [...DEFAULT_EQUIPMENT_LIST],
    symbolLibrary: [...DEFAULT_SYMBOL_LIST],
    generalToleranceLibrary: [...DEFAULT_GENERAL_TOLERANCE_PROFILES],
    partMasterLibrary: [],
  };
}

/**
 * 補齊舊版資料庫缺少的欄位（例如 equipmentLibrary、symbolLibrary、generalToleranceLibrary、partMasterLibrary）
 */
function normalizeDb(raw: Partial<DatabaseSchema>): DatabaseSchema {
  const drawings = Array.isArray(raw.drawings) ? raw.drawings : [];
  return {
    version: raw.version || "2.3",
    updatedAt: raw.updatedAt || new Date().toISOString(),
    drawings,
    equipmentLibrary:
      Array.isArray(raw.equipmentLibrary) && raw.equipmentLibrary.length > 0
        ? raw.equipmentLibrary
        : [...DEFAULT_EQUIPMENT_LIST],
    symbolLibrary:
      Array.isArray(raw.symbolLibrary)
        ? raw.symbolLibrary
        : [...DEFAULT_SYMBOL_LIST],
    generalToleranceLibrary:
      Array.isArray(raw.generalToleranceLibrary) && raw.generalToleranceLibrary.length > 0
        ? raw.generalToleranceLibrary
        : [...DEFAULT_GENERAL_TOLERANCE_PROFILES],
    partMasterLibrary: Array.isArray(raw.partMasterLibrary)
      ? raw.partMasterLibrary
      : buildInitialPartMasters(drawings),
  };
}

/**
 * 讀取本地 JSON 圖紙與儀器資料庫
 */
export function loadDatabase(): DatabaseSchema {
  const { databaseDir, filesDir, dbFilePath, seedFilePath } = getAppConfig();
  fs.mkdirSync(databaseDir, { recursive: true });
  fs.mkdirSync(filesDir, { recursive: true });

  if (!fs.existsSync(dbFilePath)) {
    if (fs.existsSync(seedFilePath)) {
      try {
        const seedRaw = JSON.parse(fs.readFileSync(seedFilePath, "utf8")) as Partial<DatabaseSchema>;
        const normalized = normalizeDb(seedRaw);
        saveDatabase(normalized);
        return normalized;
      } catch (err) {
        console.error("讀取種子資料失敗:", err);
      }
    }
    const empty = createEmptyDb();
    saveDatabase(empty);
    return empty;
  }

  try {
    const parsed = JSON.parse(fs.readFileSync(dbFilePath, "utf8")) as Partial<DatabaseSchema>;
    const normalized = normalizeDb(parsed);
    if (
      !Array.isArray(parsed.equipmentLibrary) ||
      !Array.isArray(parsed.symbolLibrary) ||
      !Array.isArray(parsed.generalToleranceLibrary) ||
      !Array.isArray(parsed.partMasterLibrary)
    ) {
      saveDatabase(normalized);
    }
    return normalized;
  } catch (err) {
    console.error("讀取資料庫 JSON 失敗:", err);
    return createEmptyDb();
  }
}

/**
 * 使用暫存檔原子覆寫資料庫，避免寫入中斷造成檔案損毀
 */
export function saveDatabase(db: DatabaseSchema): void {
  const { databaseDir, dbFilePath } = getAppConfig();
  fs.mkdirSync(databaseDir, { recursive: true });
  const payload: DatabaseSchema = {
    ...db,
    updatedAt: new Date().toISOString(),
  };
  const tmpPath = `${dbFilePath}.tmp`;
  fs.writeFileSync(tmpPath, JSON.stringify(payload, null, 2), "utf8");
  fs.renameSync(tmpPath, dbFilePath);
}

/**
 * 檢查檔名是否仍被資料庫中其他圖紙引用
 */
export function isFileReferencedByOthers(
  db: DatabaseSchema,
  filename: string | null | undefined,
  excludeDrawingId?: string
): boolean {
  if (!filename) return false;
  return db.drawings.some(
    (d) =>
      d.id !== excludeDrawingId &&
      (d.sourceFile === filename || d.compositeImageFile === filename)
  );
}
