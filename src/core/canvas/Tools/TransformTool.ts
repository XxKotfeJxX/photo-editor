import type { FabricPointerEvent } from "../../FabricEvent";
import { BaseTool } from "./BaseTool";

export class TransformTool extends BaseTool {
  activate(): void {
    this.engine.canvas.selection = true;
    this.engine.canvas.defaultCursor = "move";
  }

  deactivate(): void {
    this.engine.canvas.defaultCursor = "default";
  }

  onMouseDown(_e: FabricPointerEvent): void {}
  onMouseMove(_e: FabricPointerEvent): void {}
  onMouseUp(_e: FabricPointerEvent): void {}
}

