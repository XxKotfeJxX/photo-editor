import React, { useEffect, useState } from "react";
import { Button } from "../UI/Button";
import { ToolType } from "../../core/canvas/types/Tool";
import type { SelectionToolType } from "../../core/canvas/Tools/Selection/SelectionTool";
import type { SelectionMode } from "../../core/canvas/types/SelectionMode";

interface SideBarProps {
  onOpen: () => void;
  activeTool: ToolType | null;
  onToolSelect: (tool: ToolType) => void;
  selectionSubtool: SelectionToolType;
  selectionMode: SelectionMode;
  onSelectSubtool: (type: SelectionToolType) => void;
  onSelectSelectionMode: (mode: SelectionMode) => void;
  onInvertSelection: () => void;
}

export function SideBar({
  onOpen,
  activeTool,
  onToolSelect,
  selectionSubtool,
  selectionMode,
  onSelectSubtool,
  onSelectSelectionMode,
  onInvertSelection,
}: SideBarProps) {
  const [menuPos, setMenuPos] = useState<{ x: number; y: number } | null>(
    null
  );
  const menuRef = React.useRef<HTMLDivElement | null>(null);

  const closeMenu = () => setMenuPos(null);

  useEffect(() => {
    if (!menuPos) return;
    const handler = (e: Event) => {
      const target = e.target;
      if (menuRef.current && target instanceof Node) {
        if (menuRef.current.contains(target)) return;
      }
      closeMenu();
    };
    window.addEventListener("mousedown", handler as EventListener);
    window.addEventListener("contextmenu", handler as EventListener);
    window.addEventListener("scroll", handler as EventListener, true);
    return () => {
      window.removeEventListener("mousedown", handler as EventListener);
      window.removeEventListener("contextmenu", handler as EventListener);
      window.removeEventListener("scroll", handler as EventListener, true);
    };
  }, [menuPos]);

  const openMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setMenuPos({ x: e.clientX, y: e.clientY });
  };

  const handleSubtool = (type: SelectionToolType) => {
    onToolSelect(ToolType.Selection);
    onSelectSubtool(type);
    closeMenu();
  };

  const handleMode = (mode: SelectionMode) => {
    onToolSelect(ToolType.Selection);
    onSelectSelectionMode(mode);
    closeMenu();
  };

  const handleInvert = () => {
    onToolSelect(ToolType.Selection);
    onInvertSelection();
    closeMenu();
  };

  return (
    <div className="w-48 bg-gray-900 text-white flex flex-col p-3 border-r border-gray-700 select-none space-y-4">
      <Button variant="primary" onClick={onOpen}>
        Open
      </Button>

      <div className="flex flex-col gap-2">
        <Button
          active={activeTool === ToolType.Move}
          onClick={() => onToolSelect(ToolType.Move)}
        >
          Move
        </Button>

        <Button
          active={activeTool === ToolType.Selection}
          onClick={() => onToolSelect(ToolType.Selection)}
          onContextMenu={openMenu}
        >
          Select
        </Button>

        <Button
          active={activeTool === ToolType.Crop}
          onClick={() => onToolSelect(ToolType.Crop)}
        >
          Cut
        </Button>
      </div>

      {menuPos && (
        <div
          ref={menuRef}
          className="fixed z-50 bg-gray-800 border border-gray-700 shadow-xl rounded overflow-hidden text-sm min-w-[180px]"
          style={{ top: menuPos.y, left: menuPos.x }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="px-3 py-2 text-gray-400 uppercase text-xs">
            Selection Shape
          </div>
          {(["rect", "ellipse", "polygon", "lasso"] as SelectionToolType[]).map(
            (type) => (
              <button
                key={type}
                className={`w-full text-left px-3 py-2 hover:bg-gray-700 ${
                  selectionSubtool === type ? "bg-gray-700 text-yellow-300" : ""
                }`}
                onClick={() => handleSubtool(type)}
              >
                {type === "rect" && "Rectangle"}
                {type === "ellipse" && "Ellipse"}
                {type === "polygon" && "Polygon"}
                {type === "lasso" && "Lasso"}
              </button>
            )
          )}

          <div className="px-3 py-2 text-gray-400 uppercase text-xs border-t border-gray-700">
            Selection Mode
          </div>
          {(
            [
              ["replace", "Replace"],
              ["add", "Add"],
              ["subtract", "Subtract"],
            ] as [SelectionMode, string][]
          ).map(([mode, label]) => (
            <button
              key={mode}
              className={`w-full text-left px-3 py-2 hover:bg-gray-700 ${
                selectionMode === mode ? "bg-gray-700 text-yellow-300" : ""
              }`}
              onClick={() => handleMode(mode)}
            >
              {label}
            </button>
          ))}

          <div className="px-3 py-2 text-gray-400 uppercase text-xs border-t border-gray-700">
            Inversion
          </div>
          <button
            className="w-full text-left px-3 py-2 hover:bg-gray-700"
            onClick={handleInvert}
          >
            Invert (select outside)
          </button>
        </div>
      )}
    </div>
  );
}
