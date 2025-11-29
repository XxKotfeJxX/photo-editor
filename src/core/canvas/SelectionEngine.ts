import type {
  SelectionShape,
  RectSelection,
  EllipseSelection,
  SelectionPoint,
} from "./types/SelectionShape";
import type { SelectionState } from "./types/SelectionState";
import type { SelectionMode } from "./types/SelectionMode";
import { SelectionMath } from "./Tools/Selection/SelectionMath";

export class SelectionEngine {
  private state: SelectionState = {
    shape: null,
    draftShape: null,
    mode: "replace",
  };

  clear(): void {
    this.state.shape = null;
    this.state.draftShape = null;
  }

  clearShape(): void {
    this.state.shape = null;
  }

  hasSelection(): boolean {
    return this.state.shape !== null;
  }

  getSelection(): SelectionShape | null {
    return this.state.shape;
  }

  getDraft(): SelectionShape | null {
    return this.state.draftShape;
  }

  setDraft(shape: SelectionShape | null): void {
    this.state.draftShape = shape;
  }

  commit(mode?: SelectionMode): void {
    const draft = this.state.draftShape;
    if (!draft) return;

    const effectiveMode = mode ?? this.state.mode ?? "replace";

    if (!this.state.shape || effectiveMode === "replace") {
      this.state.shape = draft;
      this.state.mode = effectiveMode;
      this.state.draftShape = null;
      return;
    }

    const result = SelectionMath.booleanOp(
      this.state.shape,
      draft,
      effectiveMode
    );

    this.state.shape = result;
    this.state.mode = effectiveMode;
    this.state.draftShape = null;
  }

  invert(bounds: { x: number; y: number; width: number; height: number }): void {
    if (!this.state.shape) return;
    if (bounds.width <= 0 || bounds.height <= 0) return;

    const fullRect: RectSelection = {
      kind: "rect",
      x: bounds.x,
      y: bounds.y,
      width: bounds.width,
      height: bounds.height,
    };

    const inverted = SelectionMath.booleanOp(fullRect, this.state.shape, "subtract");

    this.state.shape = inverted;
    this.state.draftShape = null;
    this.state.mode = "replace";
  }

  getMode(): SelectionMode {
    return this.state.mode;
  }

  setMode(mode: SelectionMode): void {
    this.state.mode = mode;
  }

  getBounds(): { x: number; y: number; width: number; height: number } | null {
    const shape = this.state.shape;
    if (!shape) return null;

    switch (shape.kind) {
      case "rect":
        return this.boundsRect(shape);
      case "ellipse":
        return this.boundsEllipse(shape);
      case "polygon":
      case "lasso":
        return this.boundsPolygon(shape.points);
      case "compound":
        return this.boundsCompound(shape.polygons);
      default:
        return null;
    }
  }

  private boundsRect(shape: RectSelection) {
    return {
      x: shape.x,
      y: shape.y,
      width: shape.width,
      height: shape.height,
    };
  }

  private boundsEllipse(shape: EllipseSelection) {
    return {
      x: shape.cx - shape.rx,
      y: shape.cy - shape.ry,
      width: shape.rx * 2,
      height: shape.ry * 2,
    };
  }

  private boundsPolygon(points: SelectionPoint[]) {
    if (!points.length) return { x: 0, y: 0, width: 0, height: 0 };

    let minX = points[0].x;
    let minY = points[0].y;
    let maxX = points[0].x;
    let maxY = points[0].y;

    for (const p of points) {
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

  private boundsCompound(polygons: SelectionPoint[][][]) {
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;

    for (const poly of polygons) {
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

  isPointInside(x: number, y: number): boolean {
    const shape = this.state.shape;
    if (!shape) return false;

    switch (shape.kind) {
      case "rect":
        return this.pointInRect(shape, x, y);
      case "ellipse":
        return this.pointInEllipse(shape, x, y);
      case "polygon":
      case "lasso":
        return this.pointInPolygon(shape.points, x, y);
      case "compound":
        return this.pointInCompound(shape.polygons, x, y);
      default:
        return false;
    }
  }

  private pointInRect(shape: RectSelection, x: number, y: number): boolean {
    return (
      x >= shape.x &&
      x <= shape.x + shape.width &&
      y >= shape.y &&
      y <= shape.y + shape.height
    );
  }

  private pointInEllipse(
    shape: EllipseSelection,
    x: number,
    y: number
  ): boolean {
    const nx = (x - shape.cx) / shape.rx;
    const ny = (y - shape.cy) / shape.ry;
    return nx * nx + ny * ny <= 1;
  }

  private pointInPolygon(
    points: SelectionPoint[],
    x: number,
    y: number
  ): boolean {
    if (points.length < 3) return false;

    let inside = false;

    for (let i = 0, j = points.length - 1; i < points.length; j = i++) {
      const xi = points[i].x;
      const yi = points[i].y;
      const xj = points[j].x;
      const yj = points[j].y;

      const intersect =
        yi > y !== yj > y &&
        x < ((xj - xi) * (y - yi)) / (yj - yi + 0.0000001) + xi;

      if (intersect) inside = !inside;
    }

    return inside;
  }

  private pointInCompound(
    polygons: SelectionPoint[][][],
    x: number,
    y: number
  ): boolean {
    let inside = false;

    for (const poly of polygons) {
      for (const ring of poly) {
        if (ring.length < 3) continue;
        if (this.pointInPolygon(ring, x, y)) {
          inside = !inside;
        }
      }
    }

    return inside;
  }

  translate(dx: number, dy: number): void {
    const shape = this.state.shape;
    if (!shape) return;

    switch (shape.kind) {
      case "rect":
        this.state.shape = {
          ...shape,
          x: shape.x + dx,
          y: shape.y + dy,
        };
        break;

      case "ellipse":
        this.state.shape = {
          ...shape,
          cx: shape.cx + dx,
          cy: shape.cy + dy,
        };
        break;

      case "polygon":
      case "lasso":
        this.state.shape = {
          ...shape,
          points: shape.points.map((p) => ({
            x: p.x + dx,
            y: p.y + dy,
          })),
        };
        break;

      case "compound":
        this.state.shape = {
          ...shape,
          polygons: shape.polygons.map((poly) =>
            poly.map((ring) =>
              ring.map((p) => ({
                x: p.x + dx,
                y: p.y + dy,
              }))
            )
          ),
        };
        break;
    }
  }
}
