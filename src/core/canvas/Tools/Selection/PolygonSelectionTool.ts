import { BaseTool } from "../BaseTool";
import type { FabricPointerEvent } from "../../../FabricEvent";
import type { CanvasEngine } from "../../CanvasEngine";
import type { SelectionMode } from "../../types/SelectionMode";
import type {
  PolygonSelection,
  SelectionPoint,
} from "../../types/SelectionShape";

export class PolygonSelectionTool extends BaseTool {
  private points: SelectionPoint[] = [];
  private drawing = false;
  private lastMovePoint: SelectionPoint | null = null;

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
    this.lastMovePoint = null;
    this.drawing = false;
    this.engine.selection.setDraft(null);
  }

  onMouseDown(e: FabricPointerEvent): void {
    const obj = this.activeObj;
    if (!obj) return;

    const pointer = this.engine.canvas.getPointer(e.e);

    if (!this.drawing && this.engine.selection.getMode() === "replace") {
      this.engine.selection.clearShape();
    }
    const p: SelectionPoint = { x: pointer.x, y: pointer.y };

    if (!this.drawing) {
      this.points = [p];
      this.drawing = true;
      this.lastMovePoint = p;

      this.engine.selection.setDraft({
        kind: "polygon",
        points: [...this.points],
      });

      return;
    }

    if ((e.e as any).detail >= 2) {
      this.finishPolygon(e);
      return;
    }

    this.points.push(p);
    this.engine.selection.setDraft({
      kind: "polygon",
      points: [...this.points],
    });
  }

  onMouseMove(e: FabricPointerEvent): void {
    if (!this.drawing) return;

    const pointer = this.engine.canvas.getPointer(e.e);

    this.lastMovePoint = { x: pointer.x, y: pointer.y };

    const draft: PolygonSelection = {
      kind: "polygon",
      points: [...this.points, this.lastMovePoint],
    };

    this.engine.selection.setDraft(draft);
  }

  onMouseUp(): void {}

  onCancel(): void {
    this.reset();
  }

  private finishPolygon(e: FabricPointerEvent): void {
    if (!this.drawing || this.points.length < 2) {
      this.reset();
      return;
    }

    this.drawing = false;

    const poly: PolygonSelection = {
      kind: "polygon",
      points: [...this.points],
    };

    const override: SelectionMode | null = e.e.shiftKey
      ? "add"
      : e.e.altKey
      ? "subtract"
      : null;
    const mode: SelectionMode =
      override ?? this.engine.selection.getMode() ?? "replace";

    this.engine.selection.setDraft(poly);
    this.engine.selection.commit(mode);

    this.points = [];
    this.lastMovePoint = null;
  }
}
