import type { CanvasEngine } from "./CanvasEngine";
import type { SelectionShape } from "./types/SelectionShape";

export class SelectionOverlay {
  private readonly engine: CanvasEngine;
  private running = false;
  private rafId: number | null = null;
  private dashOffset = 0;

  constructor(engine: CanvasEngine) {
    this.engine = engine;
  }

  start(): void {
    if (this.running) return;
    this.running = true;
    this.loop();
  }

  destroy(): void {
    this.running = false;
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
    this.clear();
  }

  private loop = () => {
    if (!this.running) return;

    this.render();
    this.dashOffset = (this.dashOffset + 1) % 20;

    this.rafId = requestAnimationFrame(this.loop);
  };

  private clear(): void {
    const canvas = this.engine.canvas;
    const ctx = canvas.contextTop;
    const el = canvas.getElement();

    if (!ctx || !el) return;

    ctx.clearRect(0, 0, el.width, el.height);
  }

  private render(): void {
    const current = this.engine.selection.getSelection();
    const draft = this.engine.selection.getDraft();
    const canvas = this.engine.canvas;
    const ctx = canvas.contextTop;
    const el = canvas.getElement();

    if (!ctx || !el) return;

    ctx.clearRect(0, 0, el.width, el.height);

    if (!current && !draft) {
      return;
    }

    const vpt = canvas.viewportTransform ?? [1, 0, 0, 1, 0, 0];
    const retina = (canvas as any).getRetinaScaling
      ? (canvas as any).getRetinaScaling()
      : 1;
    const zoom = this.engine.getZoom();

    ctx.save();
    ctx.setTransform(
      vpt[0] * retina,
      vpt[1] * retina,
      vpt[2] * retina,
      vpt[3] * retina,
      vpt[4] * retina,
      vpt[5] * retina
    );
    ctx.lineWidth = 1 / (zoom * retina);
    ctx.strokeStyle = "#ffffff";
    ctx.setLineDash([4 / (zoom * retina), 2 / (zoom * retina)]);
    ctx.lineDashOffset = -this.dashOffset / (zoom * retina);

    if (current) {
      ctx.beginPath();
      this.traceShape(ctx, current);
      ctx.stroke();
    }

    if (draft) {
      ctx.beginPath();
      this.traceShape(ctx, draft);
      ctx.stroke();
    }

    ctx.restore();
  }

  private traceShape(ctx: CanvasRenderingContext2D, shape: SelectionShape): void {
    switch (shape.kind) {
      case "rect": {
        const { x, y, width, height } = shape;
        ctx.rect(x, y, width, height);
        break;
      }

      case "ellipse": {
        const { cx, cy, rx, ry } = shape;
        ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
        break;
      }

      case "polygon":
      case "lasso": {
        const pts = shape.points;
        if (!pts.length) return;

        ctx.moveTo(pts[0].x, pts[0].y);
        for (let i = 1; i < pts.length; i++) {
          ctx.lineTo(pts[i].x, pts[i].y);
        }
        ctx.closePath();
        break;
      }

      case "compound": {
        for (const poly of shape.polygons) {
          for (const ring of poly) {
            if (!ring.length) continue;

            ctx.moveTo(ring[0].x, ring[0].y);
            for (let i = 1; i < ring.length; i++) {
              ctx.lineTo(ring[i].x, ring[i].y);
            }
            ctx.closePath();
          }
        }
        break;
      }
    }
  }
}
