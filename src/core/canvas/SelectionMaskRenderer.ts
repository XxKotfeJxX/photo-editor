import type {
  SelectionShape,
  RectSelection,
  EllipseSelection,
} from "./types/SelectionShape";

export class SelectionMaskRenderer {
  static renderMask(
    shape: SelectionShape,
    imgEl: HTMLImageElement | HTMLCanvasElement
  ): HTMLCanvasElement {
    const bbox = this.getBoundingRect(shape);

    const maskCanvas = document.createElement("canvas");
    maskCanvas.width = bbox.width;
    maskCanvas.height = bbox.height;

    const ctx = maskCanvas.getContext("2d")!;
    ctx.save();

    ctx.translate(-bbox.x, -bbox.y);

    const fillRule = this.clipToShape(ctx, shape);

    ctx.clip(fillRule);
    ctx.drawImage(imgEl, 0, 0);

    ctx.restore();
    return maskCanvas;
  }

  static eraseMask(
    shape: SelectionShape,
    imgEl: HTMLImageElement | HTMLCanvasElement
  ): HTMLCanvasElement {
    const w = imgEl.width;
    const h = imgEl.height;

    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;

    const ctx = canvas.getContext("2d")!;
    ctx.drawImage(imgEl, 0, 0);

    ctx.save();
    const fillRule = this.clipToShape(ctx, shape);
    ctx.clip(fillRule);

    ctx.globalCompositeOperation = "destination-out";
    ctx.fillStyle = "black";
    ctx.fill(fillRule);

    ctx.restore();
    return canvas;
  }

  static clipToShape(
    ctx: CanvasRenderingContext2D,
    shape: SelectionShape
  ): CanvasFillRule {
    ctx.beginPath();

    switch (shape.kind) {
      case "rect":
        this.pathRect(ctx, shape);
        return "nonzero";
      case "ellipse":
        this.pathEllipse(ctx, shape);
        return "nonzero";
      case "polygon":
      case "lasso":
        this.pathRing(ctx, shape.points);
        return "nonzero";
      case "compound":
        this.pathCompound(ctx, shape.polygons);
        return "evenodd";
      default:
        return "nonzero";
    }
  }

  private static pathRect(ctx: CanvasRenderingContext2D, s: RectSelection) {
    ctx.rect(s.x, s.y, s.width, s.height);
  }

  private static pathEllipse(
    ctx: CanvasRenderingContext2D,
    s: EllipseSelection
  ) {
    ctx.ellipse(s.cx, s.cy, s.rx, s.ry, 0, 0, Math.PI * 2);
  }

  private static pathRing(
    ctx: CanvasRenderingContext2D,
    pts: { x: number; y: number }[]
  ) {
    if (!pts.length) return;

    ctx.moveTo(pts[0].x, pts[0].y);

    for (let i = 1; i < pts.length; i++) {
      ctx.lineTo(pts[i].x, pts[i].y);
    }

    ctx.closePath();
  }

  private static pathCompound(
    ctx: CanvasRenderingContext2D,
    polygons: { x: number; y: number }[][][]
  ) {
    for (const poly of polygons) {
      for (const ring of poly) {
        this.pathRing(ctx, ring);
      }
    }
  }

  static getBoundingRect(shape: SelectionShape) {
    switch (shape.kind) {
      case "rect":
        return {
          x: shape.x,
          y: shape.y,
          width: shape.width,
          height: shape.height,
        };

      case "ellipse":
        return {
          x: shape.cx - shape.rx,
          y: shape.cy - shape.ry,
          width: shape.rx * 2,
          height: shape.ry * 2,
        };

      case "polygon":
      case "lasso": {
        if (!shape.points.length) {
          return { x: 0, y: 0, width: 0, height: 0 };
        }

        let minX = Infinity,
          minY = Infinity,
          maxX = -Infinity,
          maxY = -Infinity;

        for (const p of shape.points) {
          if (p.x < minX) minX = p.x;
          if (p.y < minY) minY = p.y;
          if (p.x > maxX) maxX = p.x;
          if (p.y > maxY) maxY = p.y;
        }

        return {
          x: minX,
          y: minY,
          width: maxX - minX,
          height: maxY - minY,
        };
      }

      case "compound": {
        let minX = Infinity,
          minY = Infinity,
          maxX = -Infinity,
          maxY = -Infinity;

        for (const poly of shape.polygons) {
          for (const ring of poly) {
            for (const p of ring) {
              if (p.x < minX) minX = p.x;
              if (p.y < minY) minY = p.y;
              if (p.x > maxX) maxX = p.x;
              if (p.y > maxY) maxY = p.y;
            }
          }
        }

        if (minX === Infinity || minY === Infinity) {
          return { x: 0, y: 0, width: 0, height: 0 };
        }

        return {
          x: minX,
          y: minY,
          width: maxX - minX,
          height: maxY - minY,
        };
      }

      default:
        return { x: 0, y: 0, width: 0, height: 0 };
    }
  }
}
