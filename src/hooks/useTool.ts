import { useState } from "react";
import type { ToolType } from "../core/canvas/types/Tool";
import type { ToolInstances } from "../core/ToolInstances";
import type { CanvasEngine } from "../core/canvas/CanvasEngine";

export function useTool(
  engine: CanvasEngine | null,
  tools: ToolInstances | null
) {
  const [activeTool, setActiveTool] = useState<ToolType | null>(null);

  const selectTool = (type: ToolType) => {
    if (!engine || !tools) return;

    setActiveTool(type);

    const tool = tools[type];
    if (tool) engine.setTool(tool, type);
  };

  return { activeTool, selectTool };
}
