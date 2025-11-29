import type { FabricObject } from "fabric";

export interface Layer {
  id: string;
  name: string;
  object: FabricObject;
  visible: boolean;
}
