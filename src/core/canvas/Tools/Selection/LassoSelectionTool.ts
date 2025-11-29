import { BaseTool } from "../BaseTool";
import type { FabricPointerEvent } from "../../../FabricEvent";
import type { CanvasEngine } from "../../CanvasEngine";
import type {
  LassoSelection,
  SelectionPoint,
} from "../../types/SelectionShape";
import type { SelectionMode } from "../../types/SelectionMode";

export class LassoSelectionTool extends BaseTool {
  private points: SelectionPoint[] = [];
  private drawing = false;

  constructor(engine: CanvasEngine) {
    super(engine);
  }

  onEnter(): void {
    this.engine.canvas.setCursor("crosshair");
  }

  onExit(): void {
    this.engine.canvas.setCursor("default");
    this.reset();
  }

  private reset(): void {
    this.points = [];
    this.drawing = false;
    this.engine.selection.setDraft(null);
  }

  onMouseDown(e: FabricPointerEvent): void {
    const obj = this.activeObj;
    if (!obj) return;

    const pointer = this.engine.canvas.getPointer(e.e);

    if (this.engine.selection.getMode() === "replace") {
      this.engine.selection.clearShape();
    }

    this.points = [{ x: pointer.x, y: pointer.y }];
    this.drawing = true;

    const draft: LassoSelection = {
      kind: "lasso",
      points: [...this.points],
    };

    this.engine.selection.setDraft(draft);
  }

  onMouseMove(e: FabricPointerEvent): void {
    if (!this.drawing) return;

    const pointer = this.engine.canvas.getPointer(e.e);

    this.points.push({ x: pointer.x, y: pointer.y });

    const draft: LassoSelection = {
      kind: "lasso",
      points: [...this.points],
    };

    this.engine.selection.setDraft(draft);
  }

  onMouseUp(e: FabricPointerEvent): void {
    if (!this.drawing) return;

    this.drawing = false;

    const result: LassoSelection = {
      kind: "lasso",
      points: [...this.points],
    };

    const override: SelectionMode | null = e.e.shiftKey
      ? "add"
      : e.e.altKey
      ? "subtract"
      : null;
    const mode: SelectionMode =
      override ?? this.engine.selection.getMode() ?? "replace";

    this.engine.selection.setDraft(result);
    this.engine.selection.commit(mode);

    this.points = [];
  }

  onCancel(): void {
    this.reset();
  }
}
