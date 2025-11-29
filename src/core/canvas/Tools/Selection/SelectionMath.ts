import * as polyclip from "polygon-clipping";

import type {
  SelectionShape,
  RectSelection,
  EllipseSelection,
  SelectionPoint,
  CompoundSelection,
} from "../../types/SelectionShape";

import type { SelectionMode } from "../../types/SelectionMode";




type Pair = [number, number];
type Ring = Pair[];
type Polygon = Ring[];
type MultiPolygon = Polygon[];
type Geom = MultiPolygon;





function closeRing(points: SelectionPoint[]): Ring {
  if (!points.length) return [];

  const ring: Ring = points.map((p) => [p.x, p.y]);
  const [fx, fy] = ring[0];
  const [lx, ly] = ring[ring.length - 1];

  if (fx !== lx || fy !== ly) {
    ring.push([fx, fy]);
  }

  return ring;
}

function rectToPoly(shape: RectSelection): Geom {
  const { x, y, width, height } = shape;

  const ring: Ring = [
    [x, y],
    [x + width, y],
    [x + width, y + height],
    [x, y + height],
    [x, y],
  ];

  return [[ring]];
}

function ellipseToPoly(shape: EllipseSelection): Geom {
  const { cx, cy, rx, ry } = shape;
  const pts: Ring = [];
  const steps = 64;

  for (let i = 0; i <= steps; i++) {
    const t = (i / steps) * Math.PI * 2;
    pts.push([cx + Math.cos(t) * rx, cy + Math.sin(t) * ry]);
  }


  pts.push([...pts[0]]);

  return [[pts]];
}

function pointsToPoly(points: SelectionPoint[]): Geom {
  const ring = closeRing(points);
  return ring.length ? [[ring]] : [];
}

function compoundToPoly(shape: CompoundSelection): Geom {
  const polys: Geom = [];

  for (const poly of shape.polygons) {
    const rings = poly
      .map((ring) => closeRing(ring))
      .filter((ring) => ring.length);

    if (rings.length) {
      polys.push(rings);
    }
  }

  return polys;
}

function shapeToPoly(shape: SelectionShape): Geom {
  switch (shape.kind) {
    case "rect":
      return rectToPoly(shape);

    case "ellipse":
      return ellipseToPoly(shape);

    case "polygon":
    case "lasso":
      return pointsToPoly(shape.points);

    case "compound":
      return compoundToPoly(shape);

    default:
      return [];
  }
}

function polyToSelection(poly: Geom): SelectionShape | null {
  if (!poly.length) return null;

  const polygons = (poly as MultiPolygon)
    .map((polygon) =>
      polygon
        .map((ring) => ring.map(([x, y]) => ({ x, y })))
        .filter((ring) => ring.length)
    )
    .filter((polygon) => polygon.length);

  if (!polygons.length) return null;

  if (polygons.length === 1 && polygons[0].length === 1) {
    return {
      kind: "polygon",
      points: polygons[0][0],
    };
  }

  return {
    kind: "compound",
    polygons,
  };
}





export class SelectionMath {
  static booleanOp(
    a: SelectionShape,
    b: SelectionShape,
    mode: SelectionMode
  ): SelectionShape | null {
    const pa = shapeToPoly(a);
    const pb = shapeToPoly(b);

    let result: Geom;

    switch (mode) {
      case "add":
        result = polyclip.union(pa, pb);
        break;

      case "subtract":
        result = polyclip.difference(pa, pb);
        break;

      default:
        return b;
    }

    if (!result || !result.length) return null;

    return polyToSelection(result);
  }
}
