import type { MoveTool } from "./canvas/Tools/MoveTool";
import type { CropTool } from "./canvas/Tools/CropTool";
import type { SelectionTool } from "./canvas/Tools/Selection/SelectionTool";
import type { TransformTool } from "./canvas/Tools/TransformTool";

export interface ToolInstances {
  move: MoveTool;
  crop: CropTool;
  selection: SelectionTool;
  transform: TransformTool;
}
