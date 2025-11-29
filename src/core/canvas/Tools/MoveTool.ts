import { BaseTool } from "./BaseTool";
import type { CanvasEngine } from "../CanvasEngine";

export class MoveTool extends BaseTool {
  constructor(engine: CanvasEngine) {
    super(engine, true);
  }

  onEnter(): void {
    this.engine.canvas.setCursor("move");
  }

  onExit(): void {
    this.engine.canvas.setCursor("default");
  }
}
