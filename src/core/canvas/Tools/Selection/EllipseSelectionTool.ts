import { BaseTool } from "../BaseTool";
import type { FabricPointerEvent } from "../../../FabricEvent";
import type { CanvasEngine } from "../../CanvasEngine";
import type { SelectionMode } from "../../types/SelectionMode";
import type { EllipseSelection } from "../../types/SelectionShape";

export class EllipseSelectionTool extends BaseTool {
  private startX = 0;
  private startY = 0;
  private drawing = false;

  constructor(engine: CanvasEngine) {
    super(engine);
  }

  onEnter(): void {
    this.engine.canvas.setCursor("crosshair");
  }

  onExit(): void {
    this.engine.canvas.setCursor("default");
    this.engine.selection.setDraft(null);
    this.drawing = false;
  }

  onMouseDown(e: FabricPointerEvent): void {
    const obj = this.activeObj;
    if (!obj) return;

    const pointer = this.engine.canvas.getPointer(e.e);

    if (this.engine.selection.getMode() === "replace") {
      this.engine.selection.clearShape();
    }

    this.startX = pointer.x;
    this.startY = pointer.y;
    this.drawing = true;

    const draft: EllipseSelection = {
      kind: "ellipse",
      cx: this.startX,
      cy: this.startY,
      rx: 0.0001,
      ry: 0.0001,
    };

    this.engine.selection.setDraft(draft);
  }

  onMouseMove(e: FabricPointerEvent): void {
    if (!this.drawing) return;

    const pointer = this.engine.canvas.getPointer(e.e);

    const cx = (this.startX + pointer.x) / 2;
    const cy = (this.startY + pointer.y) / 2;
    const rx = Math.abs(pointer.x - this.startX) / 2;
    const ry = Math.abs(pointer.y - this.startY) / 2;

    const draft: EllipseSelection = {
      kind: "ellipse",
      cx,
      cy,
      rx,
      ry,
    };

    this.engine.selection.setDraft(draft);
  }

  onMouseUp(e: FabricPointerEvent): void {
    if (!this.drawing) return;
    this.drawing = false;

    const draft = this.engine.selection.getDraft() as EllipseSelection | null;
    if (!draft || (draft.rx < 1 && draft.ry < 1)) {
      this.engine.selection.setDraft(null);
      return;
    }

    const override: SelectionMode | null = e.e.shiftKey
      ? "add"
      : e.e.altKey
      ? "subtract"
      : null;
    const mode: SelectionMode =
      override ?? this.engine.selection.getMode() ?? "replace";

    this.engine.selection.commit(mode);
  }

  onCancel(): void {
    this.engine.selection.setDraft(null);
    this.drawing = false;
  }
}
