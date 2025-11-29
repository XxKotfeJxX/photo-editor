import type { Image as FabricImage } from "fabric";

let clipboardImage: FabricImage | null = null;

export function setClipboard(img: FabricImage): void {
  clipboardImage = img;
}

export function getClipboard(): FabricImage | null {
  return clipboardImage;
}

export function clearClipboard(): void {
  clipboardImage = null;
}
