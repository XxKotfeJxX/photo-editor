export type SelectionPoint = {
  x: number;
  y: number;
};

export type SelectionKind =
  | "rect"
  | "ellipse"
  | "polygon"
  | "lasso"
  | "compound";

interface BaseSelectionShape {
  kind: SelectionKind;
}

export interface RectSelection extends BaseSelectionShape {
  kind: "rect";
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface EllipseSelection extends BaseSelectionShape {
  kind: "ellipse";
  cx: number;
  cy: number;
  rx: number;
  ry: number;
}

export interface PolygonSelection extends BaseSelectionShape {
  kind: "polygon";
  points: SelectionPoint[];
}

export interface LassoSelection extends BaseSelectionShape {
  kind: "lasso";
  points: SelectionPoint[];
}

export type SelectionRing = SelectionPoint[];
export type SelectionPolygon = SelectionRing[];

export interface CompoundSelection extends BaseSelectionShape {
  kind: "compound";
  polygons: SelectionPolygon[];
}

export type SelectionShape =
  | RectSelection
  | EllipseSelection
  | PolygonSelection
  | LassoSelection
  | CompoundSelection;
