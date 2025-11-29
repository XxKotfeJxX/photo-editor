export const cropUtils = {
  extractRegion(
    source: HTMLCanvasElement,
    x: number,
    y: number,
    w: number,
    h: number
  ): HTMLCanvasElement {
    const c = document.createElement("canvas");
    c.width = w;
    c.height = h;

    const ctx = c.getContext("2d");
    if (!ctx) return c;

    ctx.drawImage(source, x, y, w, h, 0, 0, w, h);
    return c;
  },

  toDataURL(canvas: HTMLCanvasElement): string {
    return canvas.toDataURL("image/png");
  },

  normalizeRect(sx: number, sy: number, ex: number, ey: number) {
    const left = Math.min(sx, ex);
    const top = Math.min(sy, ey);
    const width = Math.abs(ex - sx);
    const height = Math.abs(ey - sy);
    return { left, top, width, height };
  },
};
