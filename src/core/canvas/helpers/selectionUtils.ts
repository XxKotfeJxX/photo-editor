export interface Point {
  x: number;
  y: number;
}

export const selectionUtils = {
  close(points: Point[]): Point[] {
    if (points.length === 0) return [];
    const first = points[0];
    const last = points[points.length - 1];

    if (first.x === last.x && first.y === last.y) return points;

    return [...points, { x: first.x, y: first.y }];
  },

  centroid(points: Point[]): Point {
    let x = 0;
    let y = 0;

    for (const p of points) {
      x += p.x;
      y += p.y;
    }

    const n = points.length || 1;
    return { x: x / n, y: y / n };
  },

  pathToPoints(path: string[]): Point[] {
    const pts: Point[] = [];

    for (const cmd of path) {
      const parts = cmd.trim().split(" ");
      if (parts.length !== 3) continue;

      const x = parseFloat(parts[1]);
      const y = parseFloat(parts[2]);

      if (!isNaN(x) && !isNaN(y)) pts.push({ x, y });
    }

    return pts;
  },

  booleanOp(
    _a: Point[],
    _b: Point[],
    _mode: "add" | "subtract"
  ): Point[] {
    return [];
  },
};
