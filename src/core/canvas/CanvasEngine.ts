import { Canvas, Point, Rect } from "fabric";
import type { FabricObject } from "fabric";
import type { BaseTool } from "./Tools/BaseTool";
import { LayerEngine } from "./LayerEngine";
import type { Layer } from "../Layer";
import { SelectionEngine } from "./SelectionEngine";
import { SelectionOverlay } from "./SelectionOverlay";
import { ToolType } from "./types/Tool";
import { fabricUtils } from "./helpers/fabricUtils";
import type { ExportFormat } from "./types/ExportFormat";

export interface LayerTransform {
  x: number;
  y: number;
  width: number;
  height: number;
  angle: number;
  opacity: number;
}

type HistoryLayer = Pick<Layer, "id" | "name" | "visible" | "opacity">;
type HistorySnapshot = {
  canvas: any;
  layers: HistoryLayer[];
  activeLayerId: string | null;
};

export class CanvasEngine {
  canvas: Canvas;
  currentTool: BaseTool | null = null;
  private allowObjectTransform = false;
  private onChange: (() => void) | null = null;
  private workspaceLocked = false;
  private resizeHandler: (() => void) | null = null;
  private zoom = 1;
  private history: HistorySnapshot[] = [];
  private historyIndex = -1;
  private suppressHistory = false;
  private renderChangeScheduled = false;
  private afterRenderHandler: (() => void) | null = null;

  layers: LayerEngine;
  selection: SelectionEngine;
  selectionOverlay: SelectionOverlay;

  constructor(canvasEl: HTMLCanvasElement) {
    this.canvas = new Canvas(canvasEl, {
      backgroundColor: "#1e1e1e",
      selection: false,
    });

    this.layers = new LayerEngine();
    this.selection = new SelectionEngine();
    this.selectionOverlay = new SelectionOverlay(this);
    this.selectionOverlay.start();

    this.setupFabricEvents();
    this.setupResize();
    this.recordHistory();
  }

  setChangeHandler(handler: (() => void) | null): void {
    this.onChange = handler;
  }

  notifyChange(): void {
    this.onChange?.();
  }

  setTool(tool: BaseTool | null, toolType?: ToolType): void {
    if (this.currentTool) {
      this.currentTool.onExit();
    }
    this.currentTool = tool;

    const enableTransforms =
      toolType === ToolType.Move || tool?.enablesObjectTransform === true;
    this.setObjectsInteractivity(enableTransforms);

    this.currentTool?.onEnter();
  }

  getActiveLayerObject(): FabricObject | null {
    const layer = this.layers.getActiveLayer();
    return layer?.object ?? null;
  }

  addLayer(object: FabricObject, name?: string, insertAboveId?: string): Layer {
    this.applyInteractivity(object, this.allowObjectTransform);

    const currentLayers = this.layers.getLayers();
    let insertIndex = currentLayers.length;

    const targetId =
      insertAboveId ?? this.layers.getActiveLayerId() ?? undefined;
    if (targetId) {
      const idx = currentLayers.findIndex((l) => l.id === targetId);
      if (idx >= 0) insertIndex = idx + 1;
    }

    const layer = this.layers.addLayer(object, name, insertIndex);
    (object as any).layerId = layer.id;
    (object as any).layerName = layer.name;

    this.canvas.add(object);
    this.syncCanvasOrder();
    this.canvas.setActiveObject(object);
    this.canvas.renderAll();
    this.notifyChange();
    this.recordHistory();

    return layer;
  }

  removeLayer(id: string): void {
    const layer = this.layers.getLayer(id);
    if (!layer) return;

    this.canvas.remove(layer.object);
    this.layers.removeLayer(id);

    if (this.layers.getLayers().length === 0) {
      this.selection.clear();
      this.canvas.clear();
      (this.canvas as any).backgroundColor = "#1e1e1e";
    }

    this.canvas.renderAll();
    this.notifyChange();
    this.recordHistory();
  }

  setActiveLayer(id: string): void {
    const layer = this.layers.getLayer(id);
    if (!layer) return;

    this.layers.setActiveLayer(id);
    this.canvas.setActiveObject(layer.object);
    this.canvas.renderAll();
    this.notifyChange();
  }

  private setActiveLayerByObject(obj: FabricObject | null | undefined): void {
    if (!obj) return;
    const layer = this.layers.getLayers().find((l) => l.object === obj);
    if (!layer) return;
    this.layers.setActiveLayer(layer.id);
    this.notifyChange();
  }

  setLayerVisibility(id: string, visible: boolean): void {
    const layer = this.layers.getLayer(id);
    if (!layer) return;

    layer.visible = visible;
    layer.object.visible = visible;

    this.canvas.renderAll();
    this.notifyChange();
    this.recordHistory();
  }

  setLayerOpacity(id: string, opacity: number): void {
    const layer = this.layers.getLayer(id);
    if (!layer) return;

    layer.opacity = opacity;
    layer.object.opacity = opacity;

    this.canvas.renderAll();
    this.notifyChange();
    this.recordHistory();
  }

  replaceLayer(id: string, newObject: FabricObject, newName?: string): void {
    const layer = this.layers.getLayer(id);
    if (!layer) return;

    this.applyInteractivity(newObject, this.allowObjectTransform);

    const oldObj = layer.object;
    const oldOpacity = layer.opacity;
    const oldVisible = layer.visible;

    this.canvas.remove(oldObj);

    newObject.opacity = oldOpacity;
    newObject.visible = oldVisible;
    (newObject as any).layerId = layer.id;
    (newObject as any).layerName = newName ?? layer.name;

    this.canvas.add(newObject);
    this.syncCanvasOrder();

    layer.object = newObject;
    if (newName) layer.name = newName;

    this.layers.setActiveLayer(id);
    this.canvas.setActiveObject(newObject);

    this.canvas.renderAll();
    this.notifyChange();
    this.recordHistory();
  }

  moveLayerAbove(sourceId: string, targetId: string): void {
    const layers = this.layers.getLayers();
    const from = layers.findIndex((l) => l.id === sourceId);
    const target = layers.findIndex((l) => l.id === targetId);
    if (from === -1 || target === -1 || from === target) return;

    const targetAfterRemoval = target - (from < target ? 1 : 0);
    const insertIndex = targetAfterRemoval + 1;

    this.layers.moveLayer(from, insertIndex);
    this.syncCanvasOrder();
    this.canvas.renderAll();
    this.notifyChange();
    this.recordHistory();
  }

  private setupResize(): void {
    const resize = () => {
      if (this.workspaceLocked) return;

      const prevWidth = this.canvas.getWidth() ?? 0;
      const prevHeight = this.canvas.getHeight() ?? 0;
      const nextWidth = window.innerWidth;
      const nextHeight = window.innerHeight - 60;

      this.canvas.setWidth(window.innerWidth);
      this.canvas.setHeight(window.innerHeight - 60);
      this.applyWorkspaceClip();
      this.canvas.renderAll();

      const changed = prevWidth !== nextWidth || prevHeight !== nextHeight;
      if (changed) {
        this.notifyChange();
      }
    };

    this.resizeHandler = resize;
    resize();
    window.addEventListener("resize", resize);
  }

  destroy(): void {
    this.selectionOverlay.destroy();
    if (this.resizeHandler) {
      window.removeEventListener("resize", this.resizeHandler);
    }
    if (this.afterRenderHandler) {
      this.canvas.off("after:render", this.afterRenderHandler);
    }
    this.canvas.dispose();
  }

  private setupFabricEvents(): void {
    const syncActive = (target: FabricObject | null | undefined) => {
      this.setActiveLayerByObject(target ?? null);
    };

    this.canvas.on("selection:created", (e: any) => {
      syncActive(e.selected?.[0] ?? e.target ?? null);
    });
    this.canvas.on("selection:updated", (e: any) => {
      syncActive(e.selected?.[0] ?? e.target ?? null);
    });
    this.canvas.on("selection:cleared", () => {
      this.notifyChange();
    });

    const notify = () => this.notifyChange();
    this.canvas.on("object:moving", notify);
    this.canvas.on("object:scaling", notify);
    this.canvas.on("object:rotating", notify);
    this.canvas.on("object:modified", () => {
      this.notifyChange();
      this.recordHistory();
    });

    const handleAfterRender = () => {
      if (this.renderChangeScheduled) return;
      this.renderChangeScheduled = true;
      requestAnimationFrame(() => {
        this.renderChangeScheduled = false;
        this.notifyChange();
      });
    };

    this.afterRenderHandler = handleAfterRender;
    this.canvas.on("after:render", handleAfterRender);
  }

  invertSelection(): void {
    const bounds = this.getActiveLayerTransform();
    if (!bounds) return;

    this.selection.invert({
      x: bounds.x,
      y: bounds.y,
      width: bounds.width,
      height: bounds.height,
    });
    this.notifyChange();
    this.recordHistory();
  }

  private applyInteractivity(obj: FabricObject, enabled: boolean): void {
    const target = obj as FabricObject & {
      selectable?: boolean;
      evented?: boolean;
      hasControls?: boolean;
      lockMovementX?: boolean;
      lockMovementY?: boolean;
      lockRotation?: boolean;
      lockScalingX?: boolean;
      lockScalingY?: boolean;
    };

    target.selectable = enabled;
    target.evented = enabled;
    target.hasControls = enabled;
    target.lockMovementX = !enabled;
    target.lockMovementY = !enabled;
    target.lockRotation = !enabled;
    target.lockScalingX = !enabled;
    target.lockScalingY = !enabled;
  }

  private setObjectsInteractivity(enabled: boolean): void {
    this.allowObjectTransform = enabled;
    this.canvas.selection = enabled;
    const layers = this.layers.getLayers();
    layers.forEach((layer) => this.applyInteractivity(layer.object, enabled));
    this.canvas.requestRenderAll();
  }

  private syncCanvasOrder(): void {
    const ordered = this.layers.getLayers();
    ordered.forEach((layer, idx) => {
      (this.canvas as any).moveTo(layer.object, idx);
    });
  }

  setWorkspaceSize(width: number, height: number): void {
    if (this.workspaceLocked) return;
    if (width <= 0 || height <= 0) return;
    this.workspaceLocked = true;
    this.canvas.setWidth(width);
    this.canvas.setHeight(height);
    this.applyWorkspaceClip();
    this.canvas.renderAll();
    this.notifyChange();
  }

  isWorkspaceLocked(): boolean {
    return this.workspaceLocked;
  }

  private applyWorkspaceClip(): void {
    const w = this.canvas.getWidth() ?? 0;
    const h = this.canvas.getHeight() ?? 0;
    const clip = new Rect({
      left: 0,
      top: 0,
      width: w,
      height: h,
      absolutePositioned: true,
      evented: false,
      selectable: false,
      fill: "transparent",
    });
    (this.canvas as any).clipPath = clip;
  }

  zoomTo(zoom: number): void {
    const next = Math.min(8, Math.max(0.1, zoom));
    this.zoom = next;
    const el = this.canvas.getElement();
    const cx = el ? el.clientWidth / 2 : (this.canvas.getWidth() ?? 0) / 2;
    const cy = el ? el.clientHeight / 2 : (this.canvas.getHeight() ?? 0) / 2;
    this.canvas.zoomToPoint(new Point(cx, cy), next);
    this.canvas.renderAll();
    this.notifyChange();
  }

  zoomIn(): void {
    this.zoomTo(this.zoom * 1.1);
  }

  zoomOut(): void {
    this.zoomTo(this.zoom / 1.1);
  }

  resetZoom(): void {
    this.zoomTo(1);
  }

  getZoom(): number {
    return this.zoom;
  }

  getActiveLayerTransform(): LayerTransform | null {
    const layer = this.layers.getActiveLayer();
    if (!layer) return null;

    const obj = layer.object as FabricObject & {
      width?: number;
      height?: number;
      scaleX?: number;
      scaleY?: number;
      left?: number;
      top?: number;
      angle?: number;
      opacity?: number;
      setCoords?: () => void;
      originX?: string;
      originY?: string;
    };

    const scaleX = obj.scaleX ?? 1;
    const scaleY = obj.scaleY ?? 1;
    const angle = obj.angle ?? 0;
    const opacity = obj.opacity ?? 1;
    const topLeft = fabricUtils.getObjectTopLeft(obj);

    return {
      x: topLeft.left,
      y: topLeft.top,
      width: (obj.width ?? 0) * scaleX,
      height: (obj.height ?? 0) * scaleY,
      angle,
      opacity,
    };
  }

  setActiveLayerTransform(partial: Partial<LayerTransform>): void {
    const layer = this.layers.getActiveLayer();
    if (!layer) return;

    const obj = layer.object as FabricObject & {
      width?: number;
      height?: number;
      scaleX?: number;
      scaleY?: number;
      left?: number;
      top?: number;
      angle?: number;
      opacity?: number;
      setCoords?: () => void;
      originX?: string;
      originY?: string;
    };

    const baseWidth = obj.width ?? 0;
    const baseHeight = obj.height ?? 0;
    const originX = obj.originX ?? "left";
    const originY = obj.originY ?? "top";
    const currentScaleX = obj.scaleX ?? 1;
    const currentScaleY = obj.scaleY ?? 1;

    let targetWidth = baseWidth * currentScaleX;
    let targetHeight = baseHeight * currentScaleY;

    if (partial.width !== undefined) {
      targetWidth = partial.width;
    }

    if (partial.height !== undefined) {
      targetHeight = partial.height;
    }

    const newScaleX = baseWidth > 0 ? targetWidth / baseWidth : currentScaleX;
    const newScaleY = baseHeight > 0 ? targetHeight / baseHeight : currentScaleY;

    const currentTopLeft = fabricUtils.getObjectTopLeft(obj);
    const targetTopLeft = {
      left: partial.x !== undefined ? partial.x : currentTopLeft.left,
      top: partial.y !== undefined ? partial.y : currentTopLeft.top,
    };

    const targetOriginPoint = fabricUtils.toOriginPoint(
      targetTopLeft,
      { width: baseWidth, height: baseHeight },
      { originX, originY, scaleX: newScaleX, scaleY: newScaleY }
    );

    obj.left = targetOriginPoint.left;
    obj.top = targetOriginPoint.top;
    obj.scaleX = newScaleX;
    obj.scaleY = newScaleY;

    if (partial.angle !== undefined) {
      obj.angle = partial.angle;
    }

    if (partial.opacity !== undefined) {
      obj.opacity = partial.opacity;
      layer.opacity = partial.opacity;
    }

    obj.setCoords?.();
    this.canvas.requestRenderAll();
    this.notifyChange();
    this.recordHistory();
  }

  private toSvgDataUrl(svg: string): string {
    return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
  }

  private toRasterDataUrl(format: ExportFormat): string {
    const fmt = format === "jpg" ? "jpeg" : format;
    return this.canvas.toDataURL({ format: fmt as any });
  }

  async exportMerged(format: ExportFormat): Promise<string> {
    if (format === "svg") {
      return this.toSvgDataUrl(this.canvas.toSVG());
    }
    return this.toRasterDataUrl(format);
  }

  async exportLayers(format: ExportFormat): Promise<
    { id: string; name: string; dataUrl: string }[]
  > {
    const allLayers = this.layers.getLayers();
    if (!allLayers.length) return [];

    const prevOnChange = this.onChange;
    const prevSuppress = this.suppressHistory;
    this.onChange = null;
    this.suppressHistory = true;

    const prevVisibility = allLayers.map((l) => ({
      id: l.id,
      visible: l.visible,
    }));

    const results: { id: string; name: string; dataUrl: string }[] = [];

    try {
      for (const layer of allLayers) {
        allLayers.forEach((l) => {
          const visible = l.id === layer.id;
          l.visible = visible;
          l.object.visible = visible;
        });

        this.canvas.renderAll();
        const dataUrl =
          format === "svg"
            ? this.toSvgDataUrl(this.canvas.toSVG())
            : this.toRasterDataUrl(format);
        results.push({ id: layer.id, name: layer.name, dataUrl });
      }
    } finally {
      prevVisibility.forEach(({ id, visible }) => {
        const layer = this.layers.getLayer(id);
        if (layer) {
          layer.visible = visible;
          layer.object.visible = visible;
        }
      });
      this.canvas.renderAll();
      this.onChange = prevOnChange;
      this.suppressHistory = prevSuppress;
    }

    return results;
  }

  undo(): void {
    if (this.historyIndex <= 0) return;
    this.restoreFromHistory(this.historyIndex - 1);
  }

  redo(): void {
    if (this.historyIndex >= this.history.length - 1) return;
    this.restoreFromHistory(this.historyIndex + 1);
  }

  private recordHistory(): void {
    if (this.suppressHistory) return;
    const objects = this.canvas.getObjects().map((o) => {
      const base =
        typeof (o as any).toObject === "function"
          ? (o as any).toObject()
          : {};
      return {
        ...base,
        layerId: (o as any).layerId ?? null,
        layerName: (o as any).layerName ?? null,
      };
    });

    const snapshot: HistorySnapshot = {
      canvas: { objects },
      layers: this.layers.getLayers().map((l) => ({
        id: l.id,
        name: l.name,
        visible: l.visible,
        opacity: l.opacity,
      })),
      activeLayerId: this.layers.getActiveLayerId(),
    };

    if (this.historyIndex < this.history.length - 1) {
      this.history = this.history.slice(0, this.historyIndex + 1);
    }
    this.history.push(snapshot);
    this.historyIndex = this.history.length - 1;
  }

  private restoreFromHistory(targetIndex: number): void {
    const snapshot = this.history[targetIndex];
    if (!snapshot) return;

    this.suppressHistory = true;
    this.selection.clear();
    this.canvas.clear();

    this.canvas
      .loadFromJSON({ objects: snapshot.canvas.objects })
      .then(() => {
        this.layers.clear();
        const objs = this.canvas.getObjects();

        snapshot.layers.forEach((l, idx) => {
          const obj =
            objs.find((o) => (o as any).layerId === l.id) ?? objs[idx] ?? null;
          if (!obj) return;
          obj.visible = l.visible;
          obj.opacity = l.opacity;
          (obj as any).layerId = l.id;
          (obj as any).layerName = l.name;
          this.applyInteractivity(obj, this.allowObjectTransform);
          this.layers.addLayer(obj, l.name, undefined, l.id);
        });

        if (snapshot.activeLayerId) {
          this.layers.setActiveLayer(snapshot.activeLayerId);
          const layer = this.layers.getActiveLayer();
          if (layer) this.canvas.setActiveObject(layer.object);
        }

        this.syncCanvasOrder();
        this.canvas.renderAll();
        this.historyIndex = targetIndex;
        this.suppressHistory = false;
        this.notifyChange();
      })
      .catch(() => {
        this.suppressHistory = false;
      });
  }
}
