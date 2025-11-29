import { useEffect } from "react";
import type { Canvas } from "fabric";
import type { LayerEngine } from "../core/canvas/LayerEngine";

export function useLayerSelection(canvas: Canvas, layers: LayerEngine) {
  useEffect(() => {
    const onSelect = () => {
      const obj = canvas.getActiveObject();
      if (!obj) return;

      const all = layers.getLayers();
      const layer = all.find((l) => l.object === obj);

      if (layer) layers.setActiveLayer(layer.id);
    };

    canvas.on("selection:updated", onSelect);
    canvas.on("selection:created", onSelect);

    return () => {
      canvas.off("selection:updated", onSelect);
      canvas.off("selection:created", onSelect);
    };
  }, [canvas, layers]);

  useEffect(() => {
    const active = layers.getActiveLayer();

    if (!active) {
      canvas.discardActiveObject();
      canvas.requestRenderAll();
      return;
    }

    canvas.setActiveObject(active.object);
    canvas.requestRenderAll();
  }, [layers, canvas]);
}
