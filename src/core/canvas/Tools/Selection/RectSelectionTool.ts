import { BaseTool } from "../BaseTool";
import type { FabricPointerEvent } from "../../../FabricEvent";
import type { CanvasEngine } from "../../CanvasEngine";
import type { SelectionMode } from "../../types/SelectionMode";
import type { RectSelection } from "../../types/SelectionShape";

export class RectSelectionTool extends BaseTool {
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

    this.engine.selection.setDraft({
      kind: "rect",
      x: this.startX,
      y: this.startY,
      width: 1,
      height: 1,
    });
  }

  onMouseMove(e: FabricPointerEvent): void {
    if (!this.drawing) return;

    const pointer = this.engine.canvas.getPointer(e.e);

    const x = Math.min(this.startX, pointer.x);
    const y = Math.min(this.startY, pointer.y);
    const w = Math.abs(pointer.x - this.startX);
    const h = Math.abs(pointer.y - this.startY);

    const draft: RectSelection = {
      kind: "rect",
      x,
      y,
      width: w,
      height: h,
    };

    this.engine.selection.setDraft(draft);
  }

  onMouseUp(e: FabricPointerEvent): void {
    if (!this.drawing) return;
    this.drawing = false;

    const draft = this.engine.selection.getDraft() as RectSelection | null;
    if (!draft || (draft.width < 2 && draft.height < 2)) {
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
  }
}
