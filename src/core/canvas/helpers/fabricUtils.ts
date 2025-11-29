import type { Canvas, FabricObject } from "fabric";

export const fabricUtils = {
  getActive(canvas: Canvas): FabricObject | null {
    return canvas.getActiveObject() ?? null;
  },

  clearSelection(canvas: Canvas): void {
    canvas.discardActiveObject();
    canvas.requestRenderAll();
  },

  centerObject(obj: FabricObject, canvas: Canvas): void {
    canvas.centerObject(obj);
    obj.setCoords();
    canvas.requestRenderAll();
  },

  getObjectBounds(obj: FabricObject) {
    const {
      left = 0,
      top = 0,
      width = 0,
      height = 0,
      scaleX = 1,
      scaleY = 1,
    } = obj;

    return {
      x: left,
      y: top,
      w: width * scaleX,
      h: height * scaleY,
    };
  },

  getObjectTopLeft(obj: FabricObject) {
    const {
      left = 0,
      top = 0,
      width = 0,
      height = 0,
      scaleX = 1,
      scaleY = 1,
      originX = "left",
      originY = "top",
    } = obj as FabricObject & {
      originX?: string;
      originY?: string;
    };

    let realLeft = left;
    let realTop = top;

    if (originX === "center") {
      realLeft -= (width * scaleX) / 2;
    } else if (originX === "right") {
      realLeft -= width * scaleX;
    }

    if (originY === "center") {
      realTop -= (height * scaleY) / 2;
    } else if (originY === "bottom") {
      realTop -= height * scaleY;
    }

    return {
      left: realLeft,
      top: realTop,
      width: width * scaleX,
      height: height * scaleY,
    };
  },

  toOriginPoint(
    topLeft: { left: number; top: number },
    size: { width: number; height: number },
    opts?: { scaleX?: number; scaleY?: number; originX?: string; originY?: string }
  ) {
    const scaleX = opts?.scaleX ?? 1;
    const scaleY = opts?.scaleY ?? 1;
    const originX = opts?.originX ?? "left";
    const originY = opts?.originY ?? "top";

    const width = size.width * scaleX;
    const height = size.height * scaleY;

    let left = topLeft.left;
    let top = topLeft.top;

    if (originX === "center") {
      left += width / 2;
    } else if (originX === "right") {
      left += width;
    }

    if (originY === "center") {
      top += height / 2;
    } else if (originY === "bottom") {
      top += height;
    }

    return { left, top };
  },

  applyPixelRatio(canvasEl: HTMLCanvasElement): void {
    const ratio = window.devicePixelRatio || 1;
    canvasEl.setAttribute("width", `${canvasEl.clientWidth * ratio}`);
    canvasEl.setAttribute("height", `${canvasEl.clientHeight * ratio}`);
  },
};
