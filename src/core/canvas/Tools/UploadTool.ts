import type { Canvas } from "fabric";
import { Image as FabricImage } from "fabric";

export class UploadTool {
  constructor(private canvas: Canvas) {}

  async loadFromFile(file: File): Promise<FabricImage> {
    const dataUrl = await this.toDataURL(file);
    const img = await FabricImage.fromURL(dataUrl);

    img.set({
      left: 0,
      top: 0,
      originX: "left",
      originY: "top",
      scaleX: 1,
      scaleY: 1,
    });

    this.canvas.add(img);
    this.canvas.setActiveObject(img);
    this.canvas.requestRenderAll();

    return img;
  }

  private toDataURL(file: File): Promise<string> {
    return new Promise((res, rej) => {
      const r = new FileReader();

      r.onload = () => {
        if (typeof r.result === "string") res(r.result);
        else rej(new Error("Invalid FileReader result"));
      };
      r.onerror = () => rej(r.error ?? new Error("Reader error"));

      r.readAsDataURL(file);
    });
  }
}
