import type { SelectionShape } from "./SelectionShape";
import type { SelectionMode } from "./SelectionMode";

export interface SelectionState {
  shape: SelectionShape | null;
  draftShape: SelectionShape | null;
  mode: SelectionMode;
}
