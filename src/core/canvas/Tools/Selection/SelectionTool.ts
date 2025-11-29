import { BaseTool } from "../BaseTool";
import type { FabricPointerEvent } from "../../../FabricEvent";
import type { CanvasEngine } from "../../CanvasEngine";
import type { SelectionMode } from "../../types/SelectionMode";
import { EllipseSelectionTool } from "./EllipseSelectionTool";
import { RectSelectionTool } from "./RectSelectionTool";
import { PolygonSelectionTool } from "./PolygonSelectionTool";
import { LassoSelectionTool } from "./LassoSelectionTool";

export type SelectionToolType = "rect" | "ellipse" | "polygon" | "lasso";

export class SelectionTool extends BaseTool {
  private subtool: BaseTool | null = null;
  private type: SelectionToolType = "rect";
  private mode: SelectionMode = "replace";
  private draggingSelection = false;
  private lastX = 0;
  private lastY = 0;

  constructor(engine: CanvasEngine) {
    super(engine);
    this.subtool = new RectSelectionTool(engine);
    this.mode = this.engine.selection.getMode();
  }

  setSubtool(type: SelectionToolType) {
    this.type = type;
    const isActive = this.engine.currentTool === this;

    if (this.subtool && isActive) {
      this.subtool.onExit();
    }

    switch (type) {
      case "rect":
        this.subtool = new RectSelectionTool(this.engine);
        break;
      case "ellipse":
        this.subtool = new EllipseSelectionTool(this.engine);
        break;
      case "polygon":
        this.subtool = new PolygonSelectionTool(this.engine);
        break;
      case "lasso":
        this.subtool = new LassoSelectionTool(this.engine);
        break;
    }

    if (isActive) {
      this.subtool.onEnter();
    }
  }

  getType(): SelectionToolType {
    return this.type;
  }

  setMode(mode: SelectionMode) {
    this.mode = mode;
    this.engine.selection.setMode(mode);
  }

  getMode(): SelectionMode {
    return this.mode;
  }

  onEnter(): void {
    this.subtool?.onEnter();
  }

  onExit(): void {
    this.subtool?.onExit();
    this.draggingSelection = false;
  }

  onMouseDown(e: FabricPointerEvent): void {
    const pointer = this.engine.canvas.getPointer(e.e);

    if (this.engine.selection.hasSelection()) {
      if (this.engine.selection.isPointInside(pointer.x, pointer.y)) {
        this.draggingSelection = true;
        this.lastX = pointer.x;
        this.lastY = pointer.y;
        return;
      }
    }

    this.subtool?.onMouseDown(e);
  }

  onMouseMove(e: FabricPointerEvent): void {
    if (this.draggingSelection) {
      const pointer = this.engine.canvas.getPointer(e.e);
      const dx = pointer.x - this.lastX;
      const dy = pointer.y - this.lastY;

      this.engine.selection.translate(dx, dy);

      this.lastX = pointer.x;
      this.lastY = pointer.y;
      return;
    }

    this.subtool?.onMouseMove(e);
  }

  onMouseUp(e: FabricPointerEvent): void {
    if (this.draggingSelection) {
      this.draggingSelection = false;
      return;
    }

    this.subtool?.onMouseUp(e);
  }

  onConfirm(): void {
    this.subtool?.onConfirm();
  }

  onCancel(): void {
    this.draggingSelection = false;
    this.subtool?.onCancel();
  }
}
