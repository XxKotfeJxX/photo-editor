import type { CanvasEngine } from "../CanvasEngine";
import type { FabricPointerEvent } from "../../FabricEvent";

export abstract class BaseTool {
  engine: CanvasEngine;
  readonly enablesObjectTransform: boolean;

  constructor(engine: CanvasEngine, enablesObjectTransform = false) {
    this.engine = engine;
    this.enablesObjectTransform = enablesObjectTransform;
  }

  get activeObj() {
    return this.engine.getActiveLayerObject();
  }

  onEnter(): void {}
  onExit(): void {}

  onMouseDown(_e: FabricPointerEvent): void {}
  onMouseMove(_e: FabricPointerEvent): void {}
  onMouseUp(_e: FabricPointerEvent): void {}

  onConfirm(): void {}

  onCancel(): void {}
}
