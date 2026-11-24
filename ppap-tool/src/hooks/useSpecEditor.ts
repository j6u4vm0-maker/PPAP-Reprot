"use client";

import { useCallback, useState } from "react";
import type { UseSpecEditorReturn } from "@/types/editor";
import type {
  BalloonPosition,
  BalloonStyle,
  CropRect,
  DrawingRecord,
  GeneralToleranceConfig,
  Page3Data,
  Page4Data,
  ParsedSpecRow,
  SpecItem,
} from "@/types/ppap";
import { createDefaultGeneralTolerance } from "@/lib/defaultTolerances";
import {
  createDefaultPage3,
  createDefaultPage4,
  DEFAULT_BALLOON_STYLE,
} from "@/utils/constants";
import { rotateCropRect90CW, rotatePosition90CW } from "@/utils/geometry";
import { renumberSpecs } from "@/utils/specFormatter";
import {
  appendEmptySpec,
  appendFormulaSpec,
  mergePastedSpecs,
  normalizeRecordForEditor,
  patchSpecItem,
  placeBalloonInSpecs,
} from "@/utils/specMutations";

/**
 * 管理編輯區之 P3/P4 資料、尺寸規格 CRUD、球標座標 CRUD 與裁切狀態
 */
export function useSpecEditor(): UseSpecEditorReturn {
  const [drawingId, setDrawingId] = useState<string | null>(null);
  const [savedSourceFile, setSavedSourceFile] = useState<string | null>(null);
  const [isDirty, setIsDirty] = useState<boolean>(false);
  const [page3, setPage3] = useState<Page3Data>(createDefaultPage3);
  const [page4, setPage4] = useState<Page4Data>(createDefaultPage4);
  const [notes, setNotes] = useState<string>("");
  const [balloonStyle, setBalloonStyle] = useState<BalloonStyle>(DEFAULT_BALLOON_STYLE);
  const [generalTolerance, setGeneralToleranceState] = useState<GeneralToleranceConfig>(
    createDefaultGeneralTolerance
  );
  const [cropRect, setCropRectState] = useState<CropRect | null>(null);
  const [selectedRowIndex, setSelectedRowIndex] = useState<number | null>(null);
  const [targetItemIndex, setTargetItemIndex] = useState<number | null>(null);

  const updateGeneralTolerance = useCallback((next: GeneralToleranceConfig): void => {
    setGeneralToleranceState(next);
    setIsDirty(true);
  }, []);

  const setCropRect = useCallback((rect: CropRect | null): void => {
    setCropRectState(rect);
    setIsDirty(true);
  }, []);

  const updatePage3 = useCallback((patch: Partial<Page3Data>): void => {
    setPage3((prev) => ({ ...prev, ...patch }));
    setIsDirty(true);
  }, []);

  const updatePage4 = useCallback((patch: Partial<Page4Data>): void => {
    setPage4((prev) => ({ ...prev, ...patch }));
    setIsDirty(true);
  }, []);

  const updateNotes = useCallback((val: string): void => {
    setNotes(val);
    setIsDirty(true);
  }, []);

  const updateBalloonStyle = useCallback((patch: Partial<BalloonStyle>): void => {
    setBalloonStyle((prev) => {
      const next = { ...prev, ...patch };
      if (patch.padZero !== undefined) {
        setPage4((p4) => ({ ...p4, specifications: renumberSpecs(p4.specifications, next.padZero) }));
      }
      return next;
    });
    setIsDirty(true);
  }, []);

  const mutateSpecs = useCallback((fn: (specs: SpecItem[]) => SpecItem[]): void => {
    setPage4((prev) => ({ ...prev, specifications: fn(prev.specifications) }));
    setIsDirty(true);
  }, []);

  const addEmptySpec = useCallback((): void => {
    mutateSpecs((s) => appendEmptySpec(s, balloonStyle.padZero, page3.sampleQtyNumber));
  }, [balloonStyle.padZero, mutateSpecs, page3.sampleQtyNumber]);

  const addFormulaSpec = useCallback(
    (formula: string): boolean => {
      const next = appendFormulaSpec(page4.specifications, formula, balloonStyle.padZero, page3.sampleQtyNumber);
      if (!next) return false;
      setPage4((prev) => ({ ...prev, specifications: next }));
      setIsDirty(true);
      return true;
    },
    [balloonStyle.padZero, page3.sampleQtyNumber, page4.specifications]
  );

  const updateSpecField = useCallback(
    (idx: number, patch: Partial<SpecItem>, syncSym = false): void => {
      mutateSpecs((s) => patchSpecItem(s, idx, patch, syncSym));
    },
    [mutateSpecs]
  );

  const moveSpecRow = useCallback(
    (idx: number, direction: -1 | 1): void => {
      mutateSpecs((specs) => {
        const target = idx + direction;
        if (target < 0 || target >= specs.length) return specs;
        const list = [...specs];
        [list[idx], list[target]] = [list[target], list[idx]];
        return renumberSpecs(list, balloonStyle.padZero);
      });
      setSelectedRowIndex(idx + direction);
    },
    [balloonStyle.padZero, mutateSpecs]
  );

  const deleteSpecRow = useCallback(
    (idx: number): void => {
      mutateSpecs((specs) => renumberSpecs(specs.filter((_, i) => i !== idx), balloonStyle.padZero));
      if (targetItemIndex === idx) setTargetItemIndex(null);
      setSelectedRowIndex(null);
    },
    [balloonStyle.padZero, mutateSpecs, targetItemIndex]
  );

  const clearAllSpecs = useCallback((): void => {
    mutateSpecs(() => []);
    setSelectedRowIndex(null);
    setTargetItemIndex(null);
  }, [mutateSpecs]);

  const applyQtyToAllSpecs = useCallback(
    (qty: number): void => mutateSpecs((specs) => specs.map((s) => ({ ...s, testQuantity: qty }))),
    [mutateSpecs]
  );

  const applyPastedSpecs = useCallback(
    (rows: ParsedSpecRow[], replaceMode: boolean): void => {
      mutateSpecs((s) => mergePastedSpecs(s, rows, replaceMode, balloonStyle.padZero, page3.sampleQtyNumber));
    },
    [balloonStyle.padZero, mutateSpecs, page3.sampleQtyNumber]
  );

  const placeBalloonAt = useCallback(
    (pos: BalloonPosition): string => {
      const res = placeBalloonInSpecs(
        page4.specifications,
        pos,
        targetItemIndex,
        balloonStyle.padZero,
        page3.sampleQtyNumber
      );
      setPage4((prev) => ({ ...prev, specifications: res.nextSpecs }));
      setSelectedRowIndex(res.placedIndex);
      if (res.clearedTarget) setTargetItemIndex(null);
      setIsDirty(true);
      return res.placedLabel;
    },
    [balloonStyle.padZero, page3.sampleQtyNumber, page4.specifications, targetItemIndex]
  );

  const moveBalloonAt = useCallback(
    (idx: number, pos: BalloonPosition): void =>
      mutateSpecs((specs) => specs.map((s, i) => (i === idx ? { ...s, balloonPosition: pos } : s))),
    [mutateSpecs]
  );

  const removeBalloonAt = useCallback(
    (idx: number): void =>
      mutateSpecs((specs) => specs.map((s, i) => (i === idx ? { ...s, balloonPosition: null } : s))),
    [mutateSpecs]
  );

  const clearAllBalloonPositions = useCallback((): void => {
    mutateSpecs((specs) => specs.map((s) => ({ ...s, balloonPosition: null })));
    setTargetItemIndex(null);
  }, [mutateSpecs]);

  const rotateBalloonsAndCrop90 = useCallback((): void => {
    mutateSpecs((specs) =>
      specs.map((s) =>
        s.balloonPosition ? { ...s, balloonPosition: rotatePosition90CW(s.balloonPosition) } : s
      )
    );
    setCropRectState((prev) => (prev ? rotateCropRect90CW(prev) : null));
  }, [mutateSpecs]);

  const applyAll = (
    id: string | null,
    srcFile: string | null,
    p3: Page3Data,
    p4: Page4Data,
    style: BalloonStyle,
    gtol: GeneralToleranceConfig,
    crop: CropRect | null,
    noteText: string,
    dirty: boolean
  ): void => {
    setDrawingId(id); setSavedSourceFile(srcFile); setBalloonStyle(style);
    setGeneralToleranceState(gtol); setCropRectState(crop); setPage3(p3);
    setPage4(p4); setNotes(noteText); setSelectedRowIndex(null);
    setTargetItemIndex(null); setIsDirty(dirty);
  };

  const hydrateFromRecord = useCallback((rec: DrawingRecord): void => {
    const n = normalizeRecordForEditor(rec);
    applyAll(n.id, n.sourceFile, n.page3, n.page4, n.balloonStyle, n.generalTolerance, n.cropRect, n.notes, false);
  }, []);

  const hydrateFromImported = useCallback(
    (d: {
      page3: Page3Data; page4: Page4Data; balloonStyle: BalloonStyle;
      generalTolerance: GeneralToleranceConfig; cropRect: CropRect | null; notes: string;
    }): void => {
      applyAll(null, null, d.page3, d.page4, d.balloonStyle, d.generalTolerance, d.cropRect, d.notes, true);
    },
    []
  );

  const resetBlank = useCallback((): void => {
    applyAll(
      null, null, createDefaultPage3(), createDefaultPage4(),
      DEFAULT_BALLOON_STYLE, createDefaultGeneralTolerance(), null, "", false
    );
  }, []);

  return {
    drawingId, savedSourceFile, isDirty, page3, page4, notes, balloonStyle, generalTolerance, cropRect,
    selectedRowIndex, targetItemIndex, setDrawingId, setSavedSourceFile, setIsDirty,
    setSelectedRowIndex, setTargetItemIndex, setCropRect, updatePage3, updatePage4,
    updateNotes, updateBalloonStyle, updateGeneralTolerance, addEmptySpec, addFormulaSpec, updateSpecField,
    moveSpecRow, deleteSpecRow, clearAllSpecs, applyQtyToAllSpecs, applyPastedSpecs,
    placeBalloonAt, moveBalloonAt, removeBalloonAt, clearAllBalloonPositions,
    rotateBalloonsAndCrop90, hydrateFromRecord, hydrateFromImported, resetBlank,
  };
}
