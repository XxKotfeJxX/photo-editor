import React from "react";
import { TopBar } from "./TopBar";
import { TabsBar } from "./TabsBar";
import { SideBar } from "./SideBar";
import { LayersPanel } from "./LayersPanel";
import { PropertiesPanel } from "./PropertiesPanel";
import { CanvasContainer } from "./CanvasContainer";

import type { ToolType } from "../../core/canvas/types/Tool";
import type { Tab } from "../../core/Tab";
import type { LayerTransform } from "../../core/canvas/CanvasEngine";
import type { SelectionToolType } from "../../core/canvas/Tools/Selection/SelectionTool";
import type { SelectionMode } from "../../core/canvas/types/SelectionMode";

interface LayerView {
  id: string;
  name: string;
  visible: boolean;
}

interface EditorShellProps {
  canvas: React.ReactNode;
  tabs: Tab[];
  activeTabId: string | null;
  onSelectTab: (id: string) => void;
  onCloseTab: (id: string) => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onResetZoom: () => void;
  onUndo: () => void;
  onRedo: () => void;
  onOpenFile: () => void;
  onSaveAs: () => void;
  onSave: () => void;
  onToolSelect: (tool: ToolType) => void;
  activeTool: ToolType | null;
  selectionSubtool: SelectionToolType;
  selectionMode: SelectionMode;
  onSelectSubtool: (type: SelectionToolType) => void;
  onSelectSelectionMode: (mode: SelectionMode) => void;
  onInvertSelection: () => void;
  layers: LayerView[];
  activeLayerId: string | null;
  onSelectLayer: (id: string) => void;
  onToggleLayerVisibility: (id: string) => void;
  onReorderLayer: (sourceId: string, targetId: string) => void;
  opacity: number;
  onOpacityChange: (value: number) => void;
  visible: boolean;
  onVisibilityToggle: (value: boolean) => void;
  activeLayerTransform: LayerTransform | null;
  onTransformChange: (vals: Partial<LayerTransform>) => void;
}

export function EditorShell({
  canvas,
  tabs,
  activeTabId,
  onSelectTab,
  onCloseTab,
  onZoomIn,
  onZoomOut,
  onResetZoom,
  onUndo,
  onRedo,
  onOpenFile,
  onSaveAs,
  onSave,
  onToolSelect,
  activeTool,
  selectionSubtool,
  selectionMode,
  onSelectSubtool,
  onSelectSelectionMode,
  onInvertSelection,
  layers,
  activeLayerId,
  onSelectLayer,
  onToggleLayerVisibility,
  onReorderLayer,
  visible,
  onVisibilityToggle,
  activeLayerTransform,
  onTransformChange,
}: EditorShellProps) {
  return (
    <div className="w-screen h-screen flex flex-col">
      <TopBar
        onZoomIn={onZoomIn}
        onZoomOut={onZoomOut}
        onResetZoom={onResetZoom}
        onUndo={onUndo}
        onRedo={onRedo}
        onSaveAs={onSaveAs}
        onSave={onSave}
      />

      <TabsBar
        tabs={tabs}
        activeId={activeTabId}
        onSelect={onSelectTab}
        onClose={onCloseTab}
      />

      <div className="flex flex-1 overflow-hidden">
        <SideBar
          onOpen={onOpenFile}
          onToolSelect={onToolSelect}
          activeTool={activeTool}
          selectionSubtool={selectionSubtool}
          selectionMode={selectionMode}
          onSelectSubtool={onSelectSubtool}
          onSelectSelectionMode={onSelectSelectionMode}
          onInvertSelection={onInvertSelection}
        />

        <CanvasContainer>{canvas}</CanvasContainer>

        <div className="flex flex-col w-72 bg-gray-900 border-l border-gray-700">
          <PropertiesPanel
            transform={activeLayerTransform}
            visible={visible}
            onVisibleChange={onVisibilityToggle}
            onChange={onTransformChange}
          />

          <div className="flex-1 overflow-auto">
            <LayersPanel
              layers={layers}
              activeLayerId={activeLayerId}
              onSelect={onSelectLayer}
              onToggle={onToggleLayerVisibility}
              onReorder={onReorderLayer}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
