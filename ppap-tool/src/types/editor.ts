import type {
  BalloonPosition,
  BalloonStyle,
  CropRect,
  DrawingRecord,
  GeneralToleranceConfig,
  Page3Data,
  Page4Data,
  ParsedSpecRow,
  PatchDrawingMetaPayload,
  SourceFileType,
  SpecItem,
} from "./ppap";

export interface UsePdfCanvasReturn {
  hasMedia: boolean;
  sourceFileName: string;
  sourceFileType: SourceFileType;
  pendingSourceBase64: string | null;
  clearSourceFlag: boolean;
  pdfPage: number;
  pdfNumPages: number;
  rotation: number;
  zoom: number;
  displaySize: { width: number; height: number };
  baseCanvasRef: React.MutableRefObject<HTMLCanvasElement | null>;
  displayCanvasRef: React.RefObject<HTMLCanvasElement>;
  viewportRef: React.RefObject<HTMLDivElement>;
  loadFromFile: (file: File) => Promise<void>;
  loadFromServerFile: (
    filename: string | null,
    fileType: SourceFileType,
    page?: number,
    initialRotation?: number
  ) => Promise<void>;
  loadFromDataUrl: (
    dataUrl: string,
    fileName: string,
    fileType: SourceFileType,
    initialRotation?: number
  ) => Promise<void>;
  removeSourceMedia: () => void;
  resetPendingFlags: () => void;
  goToPage: (page: number) => Promise<void>;
  changeZoom: (delta: number) => void;
  fitToViewport: () => void;
  rotate90: () => Promise<void>;
}

export interface UseSpecEditorReturn {
  drawingId: string | null;
  savedSourceFile: string | null;
  isDirty: boolean;
  page3: Page3Data;
  page4: Page4Data;
  notes: string;
  balloonStyle: BalloonStyle;
  generalTolerance: GeneralToleranceConfig;
  cropRect: CropRect | null;
  selectedRowIndex: number | null;
  targetItemIndex: number | null;
  setDrawingId: (id: string | null) => void;
  setSavedSourceFile: (file: string | null) => void;
  setIsDirty: (dirty: boolean) => void;
  setSelectedRowIndex: (idx: number | null) => void;
  setTargetItemIndex: (idx: number | null) => void;
  setCropRect: (rect: CropRect | null) => void;
  updatePage3: (patch: Partial<Page3Data>) => void;
  updatePage4: (patch: Partial<Page4Data>) => void;
  updateNotes: (val: string) => void;
  updateBalloonStyle: (patch: Partial<BalloonStyle>) => void;
  updateGeneralTolerance: (next: GeneralToleranceConfig) => void;
  addEmptySpec: () => void;
  addFormulaSpec: (formula: string) => boolean;
  updateSpecField: (idx: number, patch: Partial<SpecItem>, syncSym?: boolean) => void;
  moveSpecRow: (idx: number, direction: -1 | 1) => void;
  deleteSpecRow: (idx: number) => void;
  clearAllSpecs: () => void;
  applyQtyToAllSpecs: (qty: number) => void;
  applyPastedSpecs: (rows: ParsedSpecRow[], replaceMode: boolean) => void;
  placeBalloonAt: (pos: BalloonPosition) => string;
  moveBalloonAt: (idx: number, pos: BalloonPosition) => void;
  removeBalloonAt: (idx: number) => void;
  clearAllBalloonPositions: () => void;
  rotateBalloonsAndCrop90: () => void;
  hydrateFromRecord: (record: DrawingRecord) => void;
  hydrateFromImported: (data: {
    page3: Page3Data;
    page4: Page4Data;
    balloonStyle: BalloonStyle;
    generalTolerance: GeneralToleranceConfig;
    cropRect: CropRect | null;
    notes: string;
  }) => void;
  resetBlank: () => void;
}

export interface UseWorkspaceActionsReturn {
  getCompositeImage: () => string | null;
  loadRecord: (record: DrawingRecord) => Promise<void>;
  saveToDb: (asNew: boolean) => Promise<void>;
  patchRecordMeta: (id: string, payload: PatchDrawingMetaPayload) => Promise<DrawingRecord>;
  deleteRecord: (record: DrawingRecord) => Promise<void>;
  exportTransferJson: () => void;
  importTransferJson: (file: File) => Promise<void>;
  downloadCompositePng: () => void;
  backupDatabase: () => Promise<void>;
  restoreDatabaseFile: (file: File) => Promise<void>;
}
