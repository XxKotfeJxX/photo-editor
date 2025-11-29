import type { CanvasEngine } from "../CanvasEngine";
import type { LayerEngine } from "../LayerEngine";
import type { SelectionEngine } from "../SelectionEngine";

export interface EditorTab {
  id: string;
  name: string;
  canvas: CanvasEngine;
  layers: LayerEngine;
  selection: SelectionEngine;
}
