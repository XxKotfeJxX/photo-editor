export function distance(
  a: { x: number; y: number },
  b: { x: number; y: number }
): number {
  return Math.sqrt((b.x - a.x) ** 2 + (b.y - a.y) ** 2);
}

export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

export function isClosed(points: { x: number; y: number }[]): boolean {
  if (points.length < 3) return false;

  const first = points[0];
  const last = points[points.length - 1];

  return first.x === last.x && first.y === last.y;
}

export function polygonArea(points: { x: number; y: number }[]): number {
  let area = 0;

  for (let i = 0; i < points.length; i++) {
    const j = (i + 1) % points.length;

    area += points[i].x * points[j].y;
    area -= points[j].x * points[i].y;
  }

  return Math.abs(area) / 2;
}

export function centroid(points: { x: number; y: number }[]) {
  let x = 0;
  let y = 0;

  for (const p of points) {
    x += p.x;
    y += p.y;
  }

  const n = points.length || 1;
  return { x: x / n, y: y / n };
}
