import { Rect, Image as FabricImage } from "fabric";

import { BaseTool } from "./BaseTool";
import type { FabricPointerEvent } from "../../FabricEvent";
import type { CanvasEngine } from "../CanvasEngine";
import { CropMode } from "../../canvas/types/CropMode";
import { SelectionMaskRenderer } from "../SelectionMaskRenderer";
import { fabricUtils } from "../helpers/fabricUtils";
import type {
  SelectionShape,
  SelectionPoint,
} from "../types/SelectionShape";
import type { FabricObject } from "fabric";

export class CropTool extends BaseTool {
  private cropRect: Rect | null = null;

  private dragMode:
    | null
    | {
        move: boolean;
        top: boolean;
        bottom: boolean;
        left: boolean;
        right: boolean;
        origin: { x: number; y: number };
        rect: { left: number; top: number; width: number; height: number };
      } = null;

  constructor(
    engine: CanvasEngine,
    private mode: CropMode,
    private onCut: (img: FabricImage) => void,
    private onReplace: (img: FabricImage) => void
  ) {
    super(engine);
  }





  onEnter(): void {
    this.engine.canvas.setCursor("crosshair");
  }

  onExit(): void {
    this.engine.canvas.setCursor("default");
    this.clearCropRect();
  }

  private clearCropRect(): void {
    if (this.cropRect) {
      this.engine.canvas.remove(this.cropRect);
      this.cropRect = null;
      this.engine.canvas.requestRenderAll();
    }
    this.dragMode = null;
  }

  private ensureCropRectFromActive(): void {
    const layer = this.engine.layers.getActiveLayer();
    if (!layer) return;

    const obj = layer.object as any;
    const { left, top, width, height } = fabricUtils.getObjectTopLeft(obj);

    this.clearCropRect();

    this.cropRect = new Rect({
      left,
      top,
      width,
      height,
      fill: "rgba(0,0,0,0.25)",
      stroke: "#ffffff",
      strokeWidth: 1,
      selectable: false,
      evented: false,
    });

    this.engine.canvas.add(this.cropRect);
    this.engine.canvas.requestRenderAll();
  }

  private selectionToImageSpace(
    shape: SelectionShape,
    obj: FabricObject
  ): SelectionShape {
    const scaleX = (obj as any).scaleX ?? 1;
    const scaleY = (obj as any).scaleY ?? 1;
    const { left, top } = fabricUtils.getObjectTopLeft(obj);

    const normPoint = (p: SelectionPoint) => ({
      x: (p.x - left) / scaleX,
      y: (p.y - top) / scaleY,
    });

    switch (shape.kind) {
      case "rect":
        return {
          kind: "rect",
          x: (shape.x - left) / scaleX,
          y: (shape.y - top) / scaleY,
          width: shape.width / scaleX,
          height: shape.height / scaleY,
        };
      case "ellipse":
        return {
          kind: "ellipse",
          cx: (shape.cx - left) / scaleX,
          cy: (shape.cy - top) / scaleY,
          rx: shape.rx / scaleX,
          ry: shape.ry / scaleY,
        };
      case "polygon":
      case "lasso":
        return {
          kind: shape.kind,
          points: shape.points.map(normPoint),
        };
      case "compound":
        return {
          kind: "compound",
          polygons: shape.polygons.map((poly) =>
            poly.map((ring) => ring.map(normPoint))
          ),
        };
      default:
        return shape;
    }
  }

  private setDragModeFromPointer(px: number, py: number): void {
    const rect = this.cropRect;
    if (!rect) return;

    const left = rect.left ?? 0;
    const top = rect.top ?? 0;
    const width = rect.width ?? 0;
    const height = rect.height ?? 0;
    const right = left + width;
    const bottom = top + height;
    const tol = 8;

    const nearLeft = Math.abs(px - left) <= tol;
    const nearRight = Math.abs(px - right) <= tol;
    const nearTop = Math.abs(py - top) <= tol;
    const nearBottom = Math.abs(py - bottom) <= tol;

    const inside =
      px >= left && px <= right && py >= top && py <= bottom && width > 0 && height > 0;

    this.dragMode = {
      move: !nearLeft && !nearRight && !nearTop && !nearBottom && inside,
      top: nearTop,
      bottom: nearBottom,
      left: nearLeft,
      right: nearRight,
      origin: { x: px, y: py },
      rect: { left, top, width, height },
    };
  }





  onMouseDown(e: FabricPointerEvent): void {

    const selection = this.engine.selection.getSelection();
    if (selection) {
      const layer = this.engine.layers.getActiveLayer();
      if (!layer) return;

      const obj = layer.object as any;
      const imgEl = obj._element as HTMLImageElement | HTMLCanvasElement | null;
      if (!imgEl) return;

      const normalized = this.selectionToImageSpace(selection, obj);
      const bbox = SelectionMaskRenderer.getBoundingRect(normalized);
      const cutCanvas = SelectionMaskRenderer.renderMask(normalized, imgEl);
      const scaleX = obj.scaleX ?? 1;
      const scaleY = obj.scaleY ?? 1;
      const originX = obj.originX ?? "center";
      const originY = obj.originY ?? "center";
      const { left: objLeft, top: objTop } = fabricUtils.getObjectTopLeft(obj);
      const targetTopLeft = {
        left: objLeft + bbox.x * scaleX,
        top: objTop + bbox.y * scaleY,
      };
      const target = fabricUtils.toOriginPoint(
        targetTopLeft,
        { width: cutCanvas.width ?? 0, height: cutCanvas.height ?? 0 },
        { originX, originY, scaleX, scaleY }
      );

      const newImg = new FabricImage(cutCanvas, {
        left: target.left,
        top: target.top,
        opacity: obj.opacity,
        visible: obj.visible,
        selectable: true,
        scaleX,
        scaleY,
        angle: (obj as any).angle ?? 0,
        originX,
        originY,
      });

      this.onCut(newImg);
      return;
    }

    const obj = this.activeObj;
    if (!obj) return;

    const p = this.engine.canvas.getPointer(e.e);

    if (!this.cropRect) {

      this.ensureCropRectFromActive();
    }

    this.setDragModeFromPointer(p.x, p.y);
  }

  onMouseMove(e: FabricPointerEvent): void {
    if (!this.dragMode || !this.cropRect) return;

    const p = this.engine.canvas.getPointer(e.e);

    const { rect, origin, move, left, right, top, bottom } = this.dragMode;
    let newLeft = rect.left;
    let newTop = rect.top;
    let newWidth = rect.width;
    let newHeight = rect.height;
    const minSize = 2;

    const dx = p.x - origin.x;
    const dy = p.y - origin.y;

    if (move) {
      newLeft += dx;
      newTop += dy;
    } else {
      if (left) {
        newLeft = Math.min(rect.left + rect.width - minSize, p.x);
        newWidth = Math.max(minSize, rect.width + (rect.left - newLeft));
      }
      if (right) {
        newWidth = Math.max(minSize, rect.width + dx);
      }
      if (top) {
        newTop = Math.min(rect.top + rect.height - minSize, p.y);
        newHeight = Math.max(minSize, rect.height + (rect.top - newTop));
      }
      if (bottom) {
        newHeight = Math.max(minSize, rect.height + dy);
      }
    }

    this.cropRect.set({
      left: newLeft,
      top: newTop,
      width: newWidth,
      height: newHeight,
    });

    this.engine.canvas.requestRenderAll();
  }

  onMouseUp(): void {
    this.dragMode = null;
  }





  onConfirm(): void {
    const layer = this.engine.layers.getActiveLayer();
    if (!layer) {
      this.clearCropRect();
      return;
    }

    const obj = layer.object as any;
    const imgEl = obj._element as HTMLImageElement | HTMLCanvasElement | null;
    if (!imgEl) {
      this.clearCropRect();
      return;
    }




    const selection = this.engine.selection.getSelection();
    if (selection) {
      const normalized = this.selectionToImageSpace(selection, obj);
      const bbox = SelectionMaskRenderer.getBoundingRect(normalized);
      const cutCanvas = SelectionMaskRenderer.renderMask(normalized, imgEl);
      const scaleX = obj.scaleX ?? 1;
      const scaleY = obj.scaleY ?? 1;
      const originX = obj.originX ?? "center";
      const originY = obj.originY ?? "center";
      const { left: objLeft, top: objTop } = fabricUtils.getObjectTopLeft(obj);
      const targetTopLeft = {
        left: objLeft + bbox.x * scaleX,
        top: objTop + bbox.y * scaleY,
      };
      const target = fabricUtils.toOriginPoint(
        targetTopLeft,
        { width: cutCanvas.width ?? 0, height: cutCanvas.height ?? 0 },
        { originX, originY, scaleX, scaleY }
      );

      const newImg = new FabricImage(cutCanvas, {
        left: target.left,
        top: target.top,
        opacity: obj.opacity,
        visible: obj.visible,
        selectable: true,
        scaleX,
        scaleY,
        angle: (obj as any).angle ?? 0,
        originX,
        originY,
      });

      this.onCut(newImg);
      this.clearCropRect();
      return;
    }




    if (!this.cropRect) return;

    const { left = 0, top = 0, width = 0, height = 0 } = this.cropRect;

    if (width <= 0 || height <= 0) {
      this.clearCropRect();
      return;
    }

    const cropCanvas = document.createElement("canvas");
    cropCanvas.width = width;
    cropCanvas.height = height;

    const ctx = cropCanvas.getContext("2d")!;
    const scaleX = obj.scaleX ?? 1;
    const scaleY = obj.scaleY ?? 1;
    const originX = obj.originX ?? "center";
    const originY = obj.originY ?? "center";
    const { left: objLeft, top: objTop } = fabricUtils.getObjectTopLeft(obj);

    ctx.drawImage(
      imgEl,
      (left - objLeft) / scaleX,
      (top - objTop) / scaleY,
      width / scaleX,
      height / scaleY,
      0,
      0,
      width,
      height
    );

    const targetPos = fabricUtils.toOriginPoint(
      { left, top },
      { width: cropCanvas.width, height: cropCanvas.height },
      { originX, originY, scaleX, scaleY }
    );

    const newImg = new FabricImage(cropCanvas, {
      left: targetPos.left,
      top: targetPos.top,
      opacity: obj.opacity,
      visible: obj.visible,
      selectable: true,
      originX,
      originY,
      scaleX,
      scaleY,
    });

    if (this.mode === CropMode.CutToNewLayer) {
      this.onCut(newImg);
    } else {
      this.onReplace(newImg);
    }

    this.clearCropRect();
  }

  onCancel(): void {
    this.clearCropRect();
  }
}
