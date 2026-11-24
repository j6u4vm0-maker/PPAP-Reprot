"use client";

import React from "react";
import type { UsePdfCanvasReturn, UseSpecEditorReturn } from "@/types/editor";
import type { CanvasMode, ToastKind } from "@/types/ppap";
import { formatBalloonLabel } from "@/utils/specFormatter";
import { useClipboardImagePaste } from "@/hooks/useClipboardImagePaste";
import { DrawingCanvasToolbar } from "./DrawingCanvasToolbar";
import { DrawingCanvasStage } from "./DrawingCanvasStage";

interface LeftCanvasPanelProps {
  canvas: UsePdfCanvasReturn;
  editor: UseSpecEditorReturn;
  mode: CanvasMode;
  disablePaste?: boolean;
  onModeChange: (mode: CanvasMode) => void;
  onUploadFile: (file: File) => void;
  onOpenDb: () => void;
  onDeleteBalloonAndSpec: (idx: number) => void;
  onDownloadPng: () => void;
  showToast: (msg: string, kind?: ToastKind) => void;
}

export function LeftCanvasPanel({
  canvas,
  editor,
  mode,
  disablePaste = false,
  onModeChange,
  onUploadFile,
  onOpenDb,
  onDeleteBalloonAndSpec,
  onDownloadPng,
  showToast,
}: LeftCanvasPanelProps): React.ReactElement {
  const { pasteFromButton } = useClipboardImagePaste({
    hasMedia: canvas.hasMedia,
    disabled: disablePaste,
    onPasteImage: onUploadFile,
    showToast,
  });

  const placedBalloonCount = editor.page4.specifications.filter((s) => s.balloonPosition).length;
  const selectedSpec =
    editor.selectedRowIndex !== null ? editor.page4.specifications[editor.selectedRowIndex] : null;
  const selectedBalloonLabel = selectedSpec
    ? formatBalloonLabel(selectedSpec.item, editor.balloonStyle.padZero)
    : null;

  return (
    <section className="flex flex-col overflow-hidden border-r border-slate-300 bg-slate-200">
      <DrawingCanvasToolbar
        hasMedia={canvas.hasMedia}
        sourceFileName={canvas.sourceFileName}
        pdfPage={canvas.pdfPage}
        pdfNumPages={canvas.pdfNumPages}
        rotation={canvas.rotation}
        zoom={canvas.zoom}
        mode={mode}
        hasCrop={Boolean(editor.cropRect)}
        placedBalloonCount={placedBalloonCount}
        selectedBalloonLabel={selectedBalloonLabel}
        balloonStyle={editor.balloonStyle}
        onUploadFile={onUploadFile}
        onPasteScreenshot={() => void pasteFromButton()}
        onRemoveMedia={() => {
          if (!confirm("確定要移除目前的 PDF / 工程圖底圖嗎？")) return;
          canvas.removeSourceMedia();
          editor.setCropRect(null);
          editor.setIsDirty(true);
          showToast("已移除工程圖底圖");
        }}
        onPrevPage={() => void canvas.goToPage(canvas.pdfPage - 1)}
        onNextPage={() => void canvas.goToPage(canvas.pdfPage + 1)}
        onZoomOut={() => canvas.changeZoom(-0.15)}
        onZoomIn={() => canvas.changeZoom(0.15)}
        onZoomFit={canvas.fitToViewport}
        onRotate={() => {
          void canvas.rotate90().then(() => {
            editor.rotateBalloonsAndCrop90();
          });
        }}
        onModeChange={(nextMode) => {
          if (nextMode === "crop" && !canvas.hasMedia) {
            showToast("請先匯入 PDF 或工程圖圖片", "warn");
            return;
          }
          onModeChange(nextMode);
          if (nextMode === "crop") editor.setTargetItemIndex(null);
        }}
        onClearCrop={() => {
          editor.setCropRect(null);
          showToast("已刪除 P3 裁切範圍");
        }}
        onDeleteSelectedBalloon={() => {
          if (editor.selectedRowIndex !== null) onDeleteBalloonAndSpec(editor.selectedRowIndex);
        }}
        onClearAllBalloons={() => {
          if (!confirm("確定要清除圖面上全部球標位置嗎？（規格數值會保留）")) return;
          editor.clearAllBalloonPositions();
          showToast("已清除所有球標位置");
        }}
        onBalloonStyleChange={editor.updateBalloonStyle}
        onDownloadPng={onDownloadPng}
      />

      <DrawingCanvasStage
        hasMedia={canvas.hasMedia}
        mode={mode}
        zoom={canvas.zoom}
        specifications={editor.page4.specifications}
        balloonStyle={editor.balloonStyle}
        cropRect={editor.cropRect}
        selectedRowIndex={editor.selectedRowIndex}
        targetItemIndex={editor.targetItemIndex}
        displayCanvasRef={canvas.displayCanvasRef}
        viewportRef={canvas.viewportRef}
        onUploadFile={onUploadFile}
        onPasteScreenshot={() => void pasteFromButton()}
        onOpenDb={onOpenDb}
        onCanvasPlaceBalloon={(pos) => {
          const lbl = editor.placeBalloonAt(pos);
          if (lbl) showToast(`已放置球標 ${lbl}`, "success");
        }}
        onMoveBalloon={editor.moveBalloonAt}
        onRemoveBalloonPosition={(idx) => {
          editor.removeBalloonAt(idx);
          showToast("已移除該球標位置（規格列保留）");
        }}
        onDeleteBalloonAndSpec={onDeleteBalloonAndSpec}
        onSelectRow={editor.setSelectedRowIndex}
        onCropChange={editor.setCropRect}
      />
    </section>
  );
}
