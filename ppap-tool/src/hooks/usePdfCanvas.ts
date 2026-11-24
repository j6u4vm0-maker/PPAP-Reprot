"use client";

import { useCallback, useRef, useState } from "react";
import type { UsePdfCanvasReturn } from "@/types/editor";
import type { SourceFileType } from "@/types/ppap";
import { normalizeRotation } from "@/utils/geometry";
import {
  blobToDataUrl,
  dataUrlToBytes,
  loadPdfJsModule,
  type PdfDocumentProxy,
  type PdfJsModule,
  renderImageToCanvas,
  renderPdfPageToCanvas,
} from "@/utils/pdfLoader";

/**
 * 管理 PDF/工程圖畫布渲染、翻頁、縮放、旋轉與底圖清除
 */
export function usePdfCanvas(hasLocalPdfJs: boolean): UsePdfCanvasReturn {
  const [hasMedia, setHasMedia] = useState<boolean>(false);
  const [sourceFileName, setSourceFileName] = useState<string>("");
  const [sourceFileType, setSourceFileType] = useState<SourceFileType>("");
  const [pendingSourceBase64, setPendingSourceBase64] = useState<string | null>(null);
  const [clearSourceFlag, setClearSourceFlag] = useState<boolean>(false);
  const [pdfPage, setPdfPage] = useState<number>(1);
  const [pdfNumPages, setPdfNumPages] = useState<number>(1);
  const [rotation, setRotation] = useState<number>(0);
  const [zoom, setZoom] = useState<number>(1);
  const [displaySize, setDisplaySize] = useState<{ width: number; height: number }>({
    width: 0,
    height: 0,
  });

  const baseCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const displayCanvasRef = useRef<HTMLCanvasElement>(null);
  const viewportRef = useRef<HTMLDivElement>(null);
  const pdfjsRef = useRef<PdfJsModule | null>(null);
  const pdfDocRef = useRef<PdfDocumentProxy | null>(null);
  const rotationRef = useRef<number>(0);
  const lastImageSrcRef = useRef<string | null>(null);

  const getBaseCanvas = useCallback((): HTMLCanvasElement => {
    if (!baseCanvasRef.current) baseCanvasRef.current = document.createElement("canvas");
    return baseCanvasRef.current;
  }, []);

  const ensurePdfJs = useCallback(async (): Promise<PdfJsModule> => {
    if (pdfjsRef.current) return pdfjsRef.current;
    const mod = await loadPdfJsModule(hasLocalPdfJs);
    pdfjsRef.current = mod;
    return mod;
  }, [hasLocalPdfJs]);

  const drawToDisplay = useCallback((targetZoom: number): void => {
    const base = baseCanvasRef.current;
    const canvas = displayCanvasRef.current;
    if (!base || !canvas || !base.width || !base.height) return;
    const w = Math.max(1, Math.round(base.width * targetZoom));
    const h = Math.max(1, Math.round(base.height * targetZoom));
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(base, 0, 0, w, h);
    setZoom(targetZoom);
    setDisplaySize({ width: w, height: h });
  }, []);

  const fitToViewport = useCallback((): void => {
    const base = baseCanvasRef.current;
    const vp = viewportRef.current;
    if (!base || !base.width || !base.height) return;
    const vw = Math.max(300, (vp?.clientWidth || 720) - 44);
    const vh = Math.max(300, (vp?.clientHeight || 560) - 44);
    const fitted = Math.max(0.15, Math.min(1.5, Math.min(vw / base.width, vh / base.height)));
    requestAnimationFrame(() => drawToDisplay(Number(fitted.toFixed(2))));
  }, [drawToDisplay]);

  const renderPage = useCallback(
    async (pageNum: number): Promise<void> => {
      if (!pdfDocRef.current) return;
      await renderPdfPageToCanvas(pdfDocRef.current, pageNum, rotationRef.current, getBaseCanvas());
      setHasMedia(true);
      setPdfPage(pageNum);
      fitToViewport();
    },
    [fitToViewport, getBaseCanvas]
  );

  const renderImg = useCallback(
    async (src: string): Promise<void> => {
      lastImageSrcRef.current = src;
      await renderImageToCanvas(src, rotationRef.current, getBaseCanvas());
      setHasMedia(true);
      fitToViewport();
    },
    [fitToViewport, getBaseCanvas]
  );

  const loadFromDataUrl = useCallback(
    async (
      dataUrl: string,
      fileName: string,
      fileType: SourceFileType,
      initialRotation = 0
    ): Promise<void> => {
      const nextRot = normalizeRotation(initialRotation);
      rotationRef.current = nextRot;
      setRotation(nextRot);
      setSourceFileName(fileName);
      setSourceFileType(fileType);
      setPendingSourceBase64(dataUrl);
      setClearSourceFlag(false);
      if (fileType === "pdf") {
        const pdfjs = await ensurePdfJs();
        const doc = await pdfjs.getDocument({ data: dataUrlToBytes(dataUrl) }).promise;
        pdfDocRef.current = doc;
        setPdfNumPages(doc.numPages);
        await renderPage(1);
        return;
      }
      pdfDocRef.current = null;
      setPdfNumPages(1);
      setPdfPage(1);
      await renderImg(dataUrl);
    },
    [ensurePdfJs, renderImg, renderPage]
  );

  const loadFromFile = useCallback(
    async (file: File): Promise<void> => {
      const isPdf = file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
      const dataUrl = await blobToDataUrl(file);
      await loadFromDataUrl(dataUrl, file.name, isPdf ? "pdf" : "image", 0);
    },
    [loadFromDataUrl]
  );

  const removeSourceMedia = useCallback((): void => {
    pdfDocRef.current = null;
    lastImageSrcRef.current = null;
    rotationRef.current = 0;
    setRotation(0);
    setHasMedia(false);
    setSourceFileName("");
    setSourceFileType("");
    setPendingSourceBase64(null);
    setClearSourceFlag(true);
    setPdfPage(1);
    setPdfNumPages(1);
    setDisplaySize({ width: 0, height: 0 });
  }, []);

  const loadFromServerFile = useCallback(
    async (
      filename: string | null,
      fileType: SourceFileType,
      page = 1,
      initialRotation = 0
    ): Promise<void> => {
      if (!filename) {
        removeSourceMedia();
        setClearSourceFlag(false);
        return;
      }
      const nextRot = normalizeRotation(initialRotation);
      rotationRef.current = nextRot;
      setRotation(nextRot);
      const url = `/api/files/${encodeURIComponent(filename)}`;
      const resolvedType: SourceFileType =
        fileType || (filename.toLowerCase().endsWith(".pdf") ? "pdf" : "image");
      setSourceFileType(resolvedType);
      setPendingSourceBase64(null);
      setClearSourceFlag(false);
      if (resolvedType === "pdf") {
        const resp = await fetch(url, { cache: "no-store" });
        if (!resp.ok) {
          throw new Error(`無法讀取伺服器圖檔（HTTP ${resp.status}）`);
        }
        const bytes = new Uint8Array(await resp.arrayBuffer());
        const pdfjs = await ensurePdfJs();
        const doc = await pdfjs.getDocument({ data: bytes }).promise;
        pdfDocRef.current = doc;
        setPdfNumPages(doc.numPages);
        await renderPage(Math.min(Math.max(1, page), doc.numPages));
        return;
      }
      pdfDocRef.current = null;
      setPdfNumPages(1);
      setPdfPage(1);
      await renderImg(url);
    },
    [ensurePdfJs, removeSourceMedia, renderImg, renderPage]
  );

  const resetPendingFlags = useCallback((): void => {
    setPendingSourceBase64(null);
    setClearSourceFlag(false);
  }, []);

  const goToPage = useCallback(
    async (page: number): Promise<void> => {
      if (!pdfDocRef.current) return;
      await renderPage(Math.min(Math.max(1, page), pdfDocRef.current.numPages));
    },
    [renderPage]
  );

  const changeZoom = useCallback(
    (delta: number): void => {
      if (!hasMedia) return;
      drawToDisplay(Math.max(0.2, Math.min(3.0, Number((zoom + delta).toFixed(2)))));
    },
    [drawToDisplay, hasMedia, zoom]
  );

  const rotate90 = useCallback(async (): Promise<void> => {
    if (!hasMedia) return;
    const nextRot = (rotationRef.current + 90) % 360;
    rotationRef.current = nextRot;
    setRotation(nextRot);
    if (pdfDocRef.current) {
      await renderPage(pdfPage);
      return;
    }
    if (lastImageSrcRef.current) await renderImg(lastImageSrcRef.current);
  }, [hasMedia, pdfPage, renderImg, renderPage]);

  return {
    hasMedia, sourceFileName, sourceFileType, pendingSourceBase64, clearSourceFlag,
    pdfPage, pdfNumPages, rotation, zoom, displaySize,
    baseCanvasRef, displayCanvasRef, viewportRef,
    loadFromFile, loadFromServerFile, loadFromDataUrl, removeSourceMedia,
    resetPendingFlags, goToPage, changeZoom, fitToViewport, rotate90,
  };
}
