import type { Point2D } from "../types/geometry";

export function closePolygon(pts: Point2D[]): Point2D[] {
  if (pts.length === 0) return pts;
  const first = pts[0];
  const last = pts[pts.length - 1];

  if (first.x === last.x && first.y === last.y) {
    return pts;
  }
  return [...pts, { x: first.x, y: first.y }];
}

export function clonePolygon(pts: Point2D[]): Point2D[] {
  return pts.map((p) => ({ ...p }));
}

export function pointInPolygon(p: Point2D, poly: Point2D[]): boolean {
  let inside = false;

  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const xi = poly[i].x;
    const yi = poly[i].y;
    const xj = poly[j].x;
    const yj = poly[j].y;

    const intersect =
      yi > p.y !== yj > p.y &&
      p.x < ((xj - xi) * (p.y - yi)) / (yj - yi + Number.EPSILON) + xi;

    if (intersect) inside = !inside;
  }

  return inside;
}

export function polygonBounds(pts: Point2D[]) {
  const xs = pts.map((p) => p.x);
  const ys = pts.map((p) => p.y);

  return {
    minX: Math.min(...xs),
    maxX: Math.max(...xs),
    minY: Math.min(...ys),
    maxY: Math.max(...ys),
  };
}
