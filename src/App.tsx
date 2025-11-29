import { useRef, useState, useEffect, useCallback } from "react";

import { EditorShell } from "./components/EditorLayout/EditorShell";
import CanvasEditor from "./components/CanvasEditor/CanvasEditor";
import { CropMode } from "./core/canvas/types/CropMode";
import type { EditorRef } from "./core/canvas/types/EditorRef";
import { ToolType } from "./core/canvas/types/Tool";
import type { SelectionToolType } from "./core/canvas/Tools/Selection/SelectionTool";
import type { SelectionMode } from "./core/canvas/types/SelectionMode";
import { OpenDialog } from "./components/dialogs/OpenDialog";
import { useTabs } from "./hooks/useTabs";
import { useHotkeys } from "./hooks/useHotkeys";
import type { Tab } from "./core/Tab";
import type { LayerTransform } from "./core/canvas/CanvasEngine";
import type { ExportFormat } from "./core/canvas/types/ExportFormat";
import { SaveAsDialog } from "./components/dialogs/SaveAsDialog";
import type { SerializedCanvasState } from "./core/canvas/CanvasEngine";

export default function App() {
  const [cropMode, setCropMode] = useState<CropMode>(CropMode.ReplaceLayer);
  const { tabs, activeTabId, createTab, closeTab, setActive, hydrate } = useTabs();
  const editorRefs = useRef<Record<string, EditorRef | null>>({});

  const [openDialog, setOpenDialog] = useState(false);
  const [activeTool, setActiveTool] = useState<ToolType>(ToolType.Move);
  const [selectionSubtool, setSelectionSubtool] =
    useState<SelectionToolType>("rect");
  const [selectionMode, setSelectionMode] =
    useState<SelectionMode>("replace");
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [saveOptions, setSaveOptions] = useState<{
    merge: boolean;
    layers: boolean;
    format: ExportFormat;
  }>({
    merge: true,
    layers: false,
    format: "png",
  });
  const [savePreviewUrl, setSavePreviewUrl] = useState<string | null>(null);
  const [saveDirectory, setSaveDirectory] = useState<any>(null);
  const [lastSavedOptions, setLastSavedOptions] = useState<{
    merge: boolean;
    layers: boolean;
    format: ExportFormat;
  } | null>(null);
  const [pendingRestores, setPendingRestores] = useState<
    Record<string, SerializedCanvasState>
  >({});

  const [layers, setLayers] = useState<
    { id: string; name: string; visible: boolean }[]
  >([]);
  const [activeLayerId, setActiveLayerId] = useState<string | null>(null);
  const [opacity, setOpacity] = useState(1);
  const [visible, setVisible] = useState(true);
  const [activeTransform, setActiveTransform] = useState<LayerTransform | null>(
    null
  );

  const getActiveEditor = (): EditorRef | null =>
    activeTabId ? editorRefs.current[activeTabId] ?? null : null;

  const activeTab = tabs.find((t) => t.id === activeTabId) ?? null;

  const sanitizeName = (name: string) =>
    name.replace(/[\\/:*?"<>|]+/g, "_").trim() || "export";

  const dataUrlToBlob = async (dataUrl: string): Promise<Blob> => {
    const res = await fetch(dataUrl);
    return await res.blob();
  };

  const canUseDirPicker = () =>
    typeof window !== "undefined" &&
    typeof (window as any).showDirectoryPicker === "function";

  const refreshSavePreview = useCallback(
    async (format: ExportFormat) => {
      const ed = getActiveEditor();
      if (!ed) {
        setSavePreviewUrl(null);
        return;
      }
      try {
        const preview = await ed.exportMerged(format);
        setSavePreviewUrl(preview);
      } catch {
        setSavePreviewUrl(null);
      }
    },
    [activeTabId]
  );

  const syncFromEditor = useCallback((ed: EditorRef | null) => {
    if (!ed) return;

    const realLayers = ed.getLayers();
    const active = ed.getActiveLayer();
    const t = ed.getActiveLayerTransform();

    setLayers(
      realLayers.map((l) => ({
        id: l.id,
        name: l.name,
        visible: l.visible,
      }))
    );

    if (active) {
      setActiveLayerId(active.id);
      setOpacity(active.opacity);
      setVisible(active.visible);
      setActiveTransform(t);
    } else {
      setActiveLayerId(null);
      setActiveTransform(null);
    }

    persistState();
  }, [persistState]);

  const applySelectionConfig = useCallback(
    (
      ed: EditorRef | null,
      cfg?: { mode?: SelectionMode; subtool?: SelectionToolType }
    ) => {
      if (!ed) return;
      const mode = cfg?.mode ?? selectionMode;
      const subtool = cfg?.subtool ?? selectionSubtool;
      ed.setSelectionSubtool(subtool);
      ed.setSelectionMode(mode);
    },
    [selectionMode, selectionSubtool]
  );

  useEffect(() => {
    const ed = getActiveEditor();
    if (!ed) return;
    setTimeout(() => {
      syncFromEditor(ed);
    }, 0);
  }, [activeTabId, syncFromEditor]);

  useEffect(() => {
    const ed = getActiveEditor();
    if (!ed) return;
    applySelectionConfig(ed);
  }, [activeTabId, applySelectionConfig]);

  useEffect(() => {
    if (!saveDialogOpen) return;
    refreshSavePreview(saveOptions.format);
  }, [saveDialogOpen, saveOptions.format, refreshSavePreview]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("pagecutter-state");
      if (!raw) return;
      const data = JSON.parse(raw) as {
        tabs?: Tab[];
        activeTabId?: string | null;
        cropMode?: CropMode;
        selectionSubtool?: SelectionToolType;
        selectionMode?: SelectionMode;
        editors?: Record<string, SerializedCanvasState>;
      };
      if (data.tabs && data.tabs.length) {
        hydrate(data.tabs, data.activeTabId ?? null);
      }
      if (data.cropMode) setCropMode(data.cropMode);
      if (data.selectionSubtool) setSelectionSubtool(data.selectionSubtool);
      if (data.selectionMode) setSelectionMode(data.selectionMode);
      if (data.editors) {
        setPendingRestores(data.editors);
      }
    } catch {
      // ignore parse errors
    }
  }, [hydrate]);

  useEffect(() => {
    if (!tabs.length) return;
    setTimeout(() => {
      setPendingRestores((prev) => {
        const next = { ...prev };
        Object.keys(next).forEach((tabId) => {
          const ed = editorRefs.current[tabId];
          if (ed && next[tabId]) {
            ed.restoreState(next[tabId]);
            delete next[tabId];
          }
        });
        return next;
      });
    }, 0);
  }, [tabs]);

  const handleToolSelect = (tool: ToolType) => {
    setActiveTool(tool);
    const ed = getActiveEditor();
    ed?.setTool(tool);
    if (tool === ToolType.Selection) {
      applySelectionConfig(ed);
    }
  };

  const handleSelectSubtool = (type: SelectionToolType) => {
    setSelectionSubtool(type);
    const ed = getActiveEditor();
    setActiveTool(ToolType.Selection);
    ed?.setTool(ToolType.Selection);
    applySelectionConfig(ed, { subtool: type });
  };

  const handleSelectMode = (mode: SelectionMode) => {
    setSelectionMode(mode);
    const ed = getActiveEditor();
    setActiveTool(ToolType.Selection);
    ed?.setTool(ToolType.Selection);
    applySelectionConfig(ed, { mode });
  };

  const handleInvertSelection = () => {
    const ed = getActiveEditor();
    if (!ed) return;
    ed.invertSelection();
    syncFromEditor(ed);
  };

  const handleSaveAsOpen = () => {
    setSaveDialogOpen(true);
    refreshSavePreview(saveOptions.format);
  };

  const handlePickDirectory = async () => {
    if (!canUseDirPicker()) return;
    try {
      const dir = await (window as any).showDirectoryPicker();
      setSaveDirectory(dir);
    } catch {
      // ignored
    }
  };

  const buildExportFiles = async (options: {
    merge: boolean;
    layers: boolean;
    format: ExportFormat;
  }) => {
    const ed = getActiveEditor();
    if (!ed) return [];

    const format = options.format;
    const merged: { name: string; dataUrl: string }[] = [];

    if (options.merge) {
      const dataUrl = await ed.exportMerged(format);
      merged.push({
        name: sanitizeName(activeTab?.name ?? "image"),
        dataUrl,
      });
    }

    let layerExports: { name: string; dataUrl: string }[] = [];
    if (options.layers) {
      const layersData = await ed.exportLayers(format);
      layerExports = layersData.map((l) => ({
        name: sanitizeName(`${activeTab?.name ?? "image"}-${l.name}`),
        dataUrl: l.dataUrl,
      }));
    }

    return [...merged, ...layerExports];
  };

  const saveToDirectory = async (
    dir: any,
    files: { name: string; dataUrl: string }[],
    ext: string
  ) => {
    const perm = await dir.queryPermission?.({ mode: "readwrite" });
    if (perm !== "granted") {
      const ask = await dir.requestPermission?.({ mode: "readwrite" });
      if (ask !== "granted") {
        throw new Error("Permission denied");
      }
    }

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const fileHandle = await dir.getFileHandle(`${file.name}.${ext}`, {
        create: true,
      });
      const writable = await fileHandle.createWritable();
      const blob = await dataUrlToBlob(file.dataUrl);
      await writable.write(blob);
      await writable.close();
    }
  };

  const downloadFallback = (
    files: { name: string; dataUrl: string }[],
    ext: string
  ) => {
    files.forEach((file, idx) => {
      const link = document.createElement("a");
      link.href = file.dataUrl;
      link.download = `${file.name || `export-${idx + 1}`}.${ext}`;
      link.click();
    });
  };

  const handleSaveAsConfirm = async () => {
    const all = await buildExportFiles(saveOptions);
    if (!all.length) return;

    const format = saveOptions.format;
    const ext =
      format === "jpeg" || format === "jpg"
        ? "jpg"
        : format === "svg"
        ? "svg"
        : format;

    setLastSavedOptions(saveOptions);

    try {
      if (saveDirectory && canUseDirPicker()) {
        await saveToDirectory(saveDirectory, all, ext);
      } else {
        downloadFallback(all, ext);
      }
    } catch {
      downloadFallback(all, ext);
    }

    setSaveDialogOpen(false);
  };

  const handleQuickSave = async () => {
    const opts = lastSavedOptions ?? saveOptions;
    if (!lastSavedOptions) {
      setSaveDialogOpen(true);
      return;
    }
    const all = await buildExportFiles(opts);
    if (!all.length) return;
    const format = opts.format;
    const ext =
      format === "jpeg" || format === "jpg"
        ? "jpg"
        : format === "svg"
        ? "svg"
        : format;

    try {
      if (saveDirectory && canUseDirPicker()) {
        await saveToDirectory(saveDirectory, all, ext);
      } else {
        downloadFallback(all, ext);
      }
    } catch {
      downloadFallback(all, ext);
    }
  };

  useEffect(() => {
    persistState();
  }, [tabs, activeTabId, cropMode, selectionSubtool, selectionMode, persistState]);

  const handleOpenHere = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";

    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0] ?? null;
      if (!file) return;

      const currentEd = getActiveEditor();
      if (currentEd) {
        await currentEd.loadImage(file);
        syncFromEditor(currentEd);
        return;
      }

      const tab = createTab(file.name || "Untitled");
      setActive(tab.id);

      setTimeout(async () => {
        const newEd = editorRefs.current[tab.id];
        if (!newEd) return;
        await newEd.loadImage(file);
        syncFromEditor(newEd);
      }, 0);
    };

    input.click();
  };

  const handleOpenNewTab = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";

    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0] ?? null;
      if (!file) return;

      const tab: Tab = createTab(file.name || "Untitled");

      setTimeout(async () => {
        const ed = editorRefs.current[tab.id];
        if (!ed) return;
        await ed.loadImage(file);
        syncFromEditor(ed);
      }, 0);
    };

    input.click();
  };

  useHotkeys({
    open: () => setOpenDialog(true),
    toolMove: () => handleToolSelect(ToolType.Move),
    toolSelect: () => handleToolSelect(ToolType.Selection),
    toolCrop: () => handleToolSelect(ToolType.Crop),
    zoomIn: () => handleZoomIn(),
    zoomOut: () => handleZoomOut(),
    quickSave: () => handleQuickSave(),
    saveAs: () => handleSaveAsOpen(),
    copy: () => {
      const ed = getActiveEditor();
      ed?.copySelection();
    },
    cut: () => {
      const ed = getActiveEditor();
      if (!ed) return;
      ed.cutSelection();
      syncFromEditor(ed);
    },
    paste: () => {
      const ed = getActiveEditor();
      if (!ed) return;
      ed.pasteClipboard();
      syncFromEditor(ed);
    },
    undo: () => {
      const ed = getActiveEditor();
      if (!ed) return;
      ed.undo();
      syncFromEditor(ed);
    },
    redo: () => {
      const ed = getActiveEditor();
      if (!ed) return;
      ed.redo();
      syncFromEditor(ed);
    },
    remove: () => {
      const ed = getActiveEditor();
      if (!ed) return;
      ed.deleteSelection();
      syncFromEditor(ed);
    },
    invertSelection: () => {
      const ed = getActiveEditor();
      if (!ed) return;
        ed.invertSelection();
        syncFromEditor(ed);
      },
    confirm: () => {
      const ed = getActiveEditor();
      if (!ed) return;
      ed.confirmTool();
      syncFromEditor(ed);
    },
    cancel: () => {
      const ed = getActiveEditor();
      ed?.cancelTool();
    },
    switchCropMode: () =>
      setCropMode((prev) =>
        prev === CropMode.ReplaceLayer
          ? CropMode.CutToNewLayer
          : CropMode.ReplaceLayer
      ),
  });

  const handleSelectLayer = (id: string) => {
    const ed = getActiveEditor();
    if (!ed) return;
    ed.selectLayer(id);
    syncFromEditor(ed);
  };

  const persistState = useCallback(() => {
    const payload: {
      tabs: Tab[];
      activeTabId: string | null;
      cropMode: CropMode;
      selectionSubtool: SelectionToolType;
      selectionMode: SelectionMode;
      editors: Record<string, SerializedCanvasState>;
    } = {
      tabs,
      activeTabId,
      cropMode,
      selectionSubtool,
      selectionMode,
      editors: {},
    };

    tabs.forEach((t) => {
      const ed = editorRefs.current[t.id];
      const snapshot = ed?.serializeState();
      if (snapshot) {
        payload.editors[t.id] = snapshot;
      }
    });

    try {
      localStorage.setItem("pagecutter-state", JSON.stringify(payload));
    } catch {
      // ignore quota errors
    }
  }, [tabs, activeTabId, cropMode, selectionMode, selectionSubtool]);

  const handleToggleVisibility = (id: string, v: boolean) => {
    const ed = getActiveEditor();
    if (!ed) return;
    ed.setLayerVisibility(id, v);
    syncFromEditor(ed);
  };

  const handleOpacityChange = (value: number) => {
    if (!activeLayerId) return;
    const ed = getActiveEditor();
    if (!ed) return;
    ed.setLayerOpacity(activeLayerId, value);
    syncFromEditor(ed);
  };

  const handleReorderLayer = (sourceId: string, targetId: string) => {
    const ed = getActiveEditor();
    if (!ed) return;
    ed.moveLayerAbove(sourceId, targetId);
    syncFromEditor(ed);
  };

  const handleZoomIn = () => {
    const ed = getActiveEditor();
    ed?.zoomIn();
  };

  const handleZoomOut = () => {
    const ed = getActiveEditor();
    ed?.zoomOut();
  };

  const handleResetZoom = () => {
    const ed = getActiveEditor();
    ed?.resetZoom();
  };

  const handleUndo = () => {
    const ed = getActiveEditor();
    if (!ed) return;
    ed.undo();
    syncFromEditor(ed);
  };

  const handleRedo = () => {
    const ed = getActiveEditor();
    if (!ed) return;
    ed.redo();
    syncFromEditor(ed);
  };

  const handleTransformChange = (vals: Partial<LayerTransform>) => {
    const ed = getActiveEditor();
    if (!ed || !activeLayerId) return;
    ed.setActiveLayerTransform(vals);
    syncFromEditor(ed);
  };

  const renderedCanvas = tabs.map((tab) => (
    <div
      key={tab.id}
      className={tab.id === activeTabId ? "w-full h-full" : "hidden"}
    >
      <CanvasEditor
        cropMode={cropMode}
        onChange={() => {
          const ed = editorRefs.current[tab.id];
          syncFromEditor(ed);
        }}
        ref={(instance) => {
          editorRefs.current[tab.id] = instance;
        }}
      />
    </div>
  ));

  return (
    <>
      <EditorShell
        canvas={renderedCanvas}
        tabs={tabs}
        activeTabId={activeTabId}
        onSelectTab={setActive}
        onCloseTab={(id) => {
          const wasActive = id === activeTabId;
          closeTab(id);
          delete editorRefs.current[id];
          if (wasActive) {
            setTimeout(() => {
              const ed = getActiveEditor();
              syncFromEditor(ed);
            }, 0);
          }
        }}
        onZoomIn={handleZoomIn}
        onZoomOut={handleZoomOut}
        onResetZoom={handleResetZoom}
        onUndo={handleUndo}
        onRedo={handleRedo}
        onOpenFile={() => setOpenDialog(true)}
        onSaveAs={handleSaveAsOpen}
        onSave={handleQuickSave}
        onToolSelect={handleToolSelect}
        activeTool={activeTool}
        selectionSubtool={selectionSubtool}
        selectionMode={selectionMode}
        onSelectSubtool={handleSelectSubtool}
        onSelectSelectionMode={handleSelectMode}
        onInvertSelection={handleInvertSelection}
        layers={layers}
        activeLayerId={activeLayerId}
        onSelectLayer={handleSelectLayer}
        onToggleLayerVisibility={(id) => {
          const layer = layers.find((l) => l.id === id);
          const nextVisible = layer ? !layer.visible : true;
          handleToggleVisibility(id, nextVisible);
        }}
        onReorderLayer={handleReorderLayer}
        opacity={opacity}
        onOpacityChange={handleOpacityChange}
        visible={visible}
        onVisibilityToggle={(v) => {
          setVisible(v);
          if (activeLayerId) {
            handleToggleVisibility(activeLayerId, v);
          }
        }}
        activeLayerTransform={activeTransform}
        onTransformChange={handleTransformChange}
      />

      <OpenDialog
        open={openDialog}
        onClose={() => setOpenDialog(false)}
        onOpenHere={handleOpenHere}
        onOpenNewTab={handleOpenNewTab}
      />

      <SaveAsDialog
        open={saveDialogOpen}
        options={saveOptions}
        previewUrl={savePreviewUrl}
        onOptionsChange={(opts) => setSaveOptions(opts)}
        directorySupported={canUseDirPicker()}
        directoryLabel={saveDirectory ? saveDirectory.name ?? "Selected" : ""}
        onPickDirectory={handlePickDirectory}
        onClose={() => setSaveDialogOpen(false)}
        onConfirm={handleSaveAsConfirm}
      />
    </>
  );
}
