import type { Layer } from "../Layer";
import type { FabricObject } from "fabric";

export class LayerEngine {
  private layers: Layer[] = [];
  private activeLayerId: string | null = null;

  getLayers(): Layer[] {
    return [...this.layers];
  }

  getLayer(id: string): Layer | null {
    return this.layers.find((l) => l.id === id) ?? null;
  }

  getActiveLayer(): Layer | null {
    return this.activeLayerId ? this.getLayer(this.activeLayerId) : null;
  }

  getActiveLayerId(): string | null {
    return this.activeLayerId;
  }

  addLayer(
    object: FabricObject,
    name?: string,
    insertIndex?: number,
    idOverride?: string
  ): Layer {
    const id = idOverride ?? crypto.randomUUID();

    const layer: Layer = {
      id,
      name: name ?? `Layer ${this.layers.length + 1}`,
      object,
      visible: true,
      opacity: 1,
    };

    const idx =
      insertIndex !== undefined
        ? Math.min(Math.max(insertIndex, 0), this.layers.length)
        : this.layers.length;

    this.layers.splice(idx, 0, layer);
    this.activeLayerId = id;

    return layer;
  }

  removeLayer(id: string): void {
    const index = this.layers.findIndex((l) => l.id === id);
    if (index === -1) return;

    const wasActive = this.activeLayerId === id;
    this.layers.splice(index, 1);

    if (!wasActive) return;

    const fallback = this.layers[index] ?? this.layers[index - 1] ?? null;
    this.activeLayerId = fallback ? fallback.id : null;
  }

  setActiveLayer(id: string): void {
    if (this.layers.some((l) => l.id === id)) {
      this.activeLayerId = id;
    }
  }

  setVisibility(id: string, visible: boolean): void {
    const layer = this.getLayer(id);
    if (!layer) return;
    layer.visible = visible;
  }

  toggleVisibility(id: string): void {
    const layer = this.getLayer(id);
    if (!layer) return;
    layer.visible = !layer.visible;
  }

  setOpacity(id: string, opacity: number): void {
    const layer = this.getLayer(id);
    if (!layer) return;

    layer.opacity = Math.max(0, Math.min(1, opacity));
  }

  clear(): void {
    this.layers = [];
    this.activeLayerId = null;
  }

  moveLayer(fromIndex: number, toIndex: number): void {
    if (
      fromIndex < 0 ||
      fromIndex >= this.layers.length ||
      toIndex < 0 ||
      toIndex > this.layers.length
    ) {
      return;
    }

    const [entry] = this.layers.splice(fromIndex, 1);
    this.layers.splice(toIndex, 0, entry);
  }
}
