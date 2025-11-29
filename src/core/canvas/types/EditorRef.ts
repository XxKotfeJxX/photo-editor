import type { ToolType } from "./Tool";
import type { Layer } from "../../Layer";
import type { LayerTransform } from "../CanvasEngine";
import type { SelectionToolType } from "../Tools/Selection/SelectionTool";
import type { SelectionMode } from "./SelectionMode";
import type { ExportFormat } from "./ExportFormat";

export interface EditorRef {
  setTool(tool: ToolType): void;
  setSelectionSubtool(type: SelectionToolType): void;
  setSelectionMode(mode: SelectionMode): void;
  invertSelection(): void;
  confirmTool(): void;
  cancelTool(): void;
  loadImage(file: File): Promise<void>;
  getClipboard(): unknown;
  copySelection(): void;
  cutSelection(): void;
  deleteSelection(): void;
  pasteClipboard(): void;
  getLayers(): Layer[];
  getActiveLayer(): Layer | null;
  selectLayer(id: string): void;
  setLayerVisibility(id: string, visible: boolean): void;
  setLayerOpacity(id: string, opacity: number): void;
  moveLayerAbove(sourceId: string, targetId: string): void;
  deleteActiveLayer(): void;
  getActiveLayerTransform(): LayerTransform | null;
  setActiveLayerTransform(transform: Partial<LayerTransform>): void;
  zoomIn(): void;
  zoomOut(): void;
  resetZoom(): void;
  undo(): void;
  redo(): void;
  exportMerged(format: ExportFormat): Promise<string>;
  exportLayers(format: ExportFormat): Promise<
    { id: string; name: string; dataUrl: string }[]
  >;
}
