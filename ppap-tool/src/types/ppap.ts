/**
 * PPAP 尺寸移轉工具共用型別定義（嚴格禁止 any）
 */

export type SourceFileType = "" | "pdf" | "image";
export type BalloonPresetKey = "classic" | "red" | "blue" | "white";
export type CanvasMode = "balloon" | "crop";
export type ToastKind = "info" | "success" | "warn" | "error";
export type SymbolInsertMode = "wrap" | "prefix" | "suffix" | "insert";

export interface BalloonPosition {
  xPercent: number;
  yPercent: number;
}

export interface BalloonStyle {
  preset: BalloonPresetKey;
  radius: number;
  bgColor: string;
  textColor: string;
  borderColor: string;
  padZero: boolean;
}

export interface CropRect {
  xPercent: number;
  yPercent: number;
  wPercent: number;
  hPercent: number;
}

export interface SpecItem {
  item: number;
  balloonLabel: string;
  dimension: string;
  tolerancePlus: string;
  toleranceMinus: string;
  upperLimit: number | null;
  lowerLimit: number | null;
  cavity: string;
  testQuantity: number;
  balloonPosition: BalloonPosition | null;
}

export interface Page3Data {
  testItems: string;
  itemNo: string;
  sampleQtyNumber: number;
  sampleQty: string;
  testStandard: string;
  revision: string;
  issueDate: string;
  combinedStandardRevDate: string;
  testConditions: string;
  judgementStandard: string;
  judgementSyncWithTestStandard: boolean;
  testEquipment: string[];
}

export interface Page4Data {
  organization: string;
  inspectionDivision: string;
  partNumber: string;
  partName: string;
  levelRecordOfDesignChange: string;
  documentOfEngineeringChange: string;
  specifications: SpecItem[];
}

export interface DrawingRecord {
  id: string;
  partNo: string;
  createdAt: string;
  updatedAt: string;
  sourceFile: string | null;
  sourceFileName: string;
  sourceFileType: SourceFileType;
  pdfPage: number;
  rotation?: number;
  compositeImageFile: string | null;
  cropRect: CropRect | null;
  balloonStyle: BalloonStyle;
  generalTolerance?: GeneralToleranceConfig;
  page3: Page3Data;
  page4: Page4Data;
  notes: string;
}

export interface EquipmentItem {
  id: string;
  label: string;
  createdAt: string;
  updatedAt: string;
}

export interface SymbolItem {
  id: string;
  label: string;
  value: string;
  mode: SymbolInsertMode;
  createdAt: string;
  updatedAt: string;
}

export interface GeneralToleranceRule {
  id: string;
  minDim: number;
  maxDim: number | null;
  plus: string;
  minus: string;
}

export interface GeneralToleranceConfig {
  enabled: boolean;
  profileName: string;
  rules: GeneralToleranceRule[];
}

export interface GeneralToleranceProfile {
  id: string;
  name: string;
  rules: GeneralToleranceRule[];
  createdAt: string;
  updatedAt: string;
}

export interface PartMasterItem {
  id: string;
  partNo: string;
  partName: string;
  testStandard: string;
  revision: string;
  issueDate: string;
  createdAt: string;
  updatedAt: string;
}

export type PartMasterInput = Omit<PartMasterItem, "id" | "createdAt" | "updatedAt">;

export interface DatabaseSchema {
  version: string;
  updatedAt: string;
  drawings: DrawingRecord[];
  equipmentLibrary: EquipmentItem[];
  symbolLibrary: SymbolItem[];
  generalToleranceLibrary: GeneralToleranceProfile[];
  partMasterLibrary: PartMasterItem[];
}

export interface SaveDrawingPayload {
  id?: string | null;
  partNo: string;
  sourceFileName?: string;
  sourceFileType?: SourceFileType;
  sourceFileBase64?: string | null;
  clearSourceFile?: boolean;
  pdfPage?: number;
  rotation?: number;
  compositeImageBase64?: string | null;
  cropRect?: CropRect | null;
  balloonStyle?: BalloonStyle;
  generalTolerance?: GeneralToleranceConfig;
  page3: Page3Data;
  page4: Page4Data;
  notes?: string;
}

export interface PatchDrawingMetaPayload {
  partNo?: string;
  testStandard?: string;
  revision?: string;
  issueDate?: string;
  partName?: string;
  notes?: string;
}

export interface TransferJsonPage3 extends Omit<Page3Data, "judgementSyncWithTestStandard"> {
  balloonedDrawingImageBase64: string | null;
}

export interface TransferJsonPayload {
  schemaVersion: string;
  exportedAt: string;
  reportOrientation: "portrait";
  partNo: string;
  page3: TransferJsonPage3;
  page4: Page4Data;
  meta: {
    sourceFileName: string;
    rotation?: number;
    balloonStyle: BalloonStyle;
    generalTolerance?: GeneralToleranceConfig;
    cropRect: CropRect | null;
    notes: string;
  };
}

export interface DatabaseBackupPayload {
  backupVersion: string;
  exportedAt: string;
  database: DatabaseSchema;
  files: Record<string, string>;
}

export interface ParsedSpecRow {
  dimension: string;
  tolerancePlus: string;
  toleranceMinus: string;
  cavity: string;
  testQuantity: number;
}

export interface HealthResponse {
  ok: boolean;
  drawingCount: number;
  equipmentCount: number;
  hasLocalPdfJs: boolean;
}
