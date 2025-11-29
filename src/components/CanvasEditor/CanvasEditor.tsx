import { useEffect, useRef, forwardRef, useImperativeHandle, useState } from "react";

import {
  Image as FabricImage,
  type FabricObject,
} from "fabric";

import { fabricUtils } from "../../core/canvas/helpers/fabricUtils";
import { CanvasEngine } from "../../core/canvas/CanvasEngine";
import type { EditorRef } from "../../core/canvas/types/EditorRef";
import type { FabricPointerEvent } from "../../core/FabricEvent";
import type { ToolInstances } from "../../core/ToolInstances";
import { ToolType } from "../../core/canvas/types/Tool";
import type { SelectionToolType } from "../../core/canvas/Tools/Selection/SelectionTool";
import type { SelectionMode } from "../../core/canvas/types/SelectionMode";
import type {
  SelectionShape,
  SelectionPoint,
} from "../../core/canvas/types/SelectionShape";

import { MoveTool } from "../../core/canvas/Tools/MoveTool";
import { CropTool } from "../../core/canvas/Tools/CropTool";
import { SelectionTool } from "../../core/canvas/Tools/Selection/SelectionTool";
import { TransformTool } from "../../core/canvas/Tools/TransformTool";
import { UploadTool } from "../../core/canvas/Tools/UploadTool";

import { CropMode } from "../../core/canvas/types/CropMode";
import { SelectionMaskRenderer } from "../../core/canvas/SelectionMaskRenderer";
import type { ExportFormat } from "../../core/canvas/types/ExportFormat";
import type { SerializedCanvasState } from "../../core/canvas/CanvasEngine";




type ImageElement = HTMLImageElement | HTMLCanvasElement;

type ClipboardPayload = {
  canvas: HTMLCanvasElement;
  scaleX: number;
  scaleY: number;
  originX: string;
  originY: string;
  angle: number;
  opacity: number;
};

function getImageElement(obj: FabricObject): ImageElement | null {
  if (!(obj instanceof FabricImage)) return null;

  const src = obj._element;
  if (!src) return null;

  if (src instanceof HTMLImageElement || src instanceof HTMLCanvasElement) {
    return src;
  }

  return null;
}


function selectionToImageSpace(
  shape: SelectionShape,
  obj: FabricObject
): SelectionShape {
  const scaleX = (obj as any).scaleX ?? 1;
  const scaleY = (obj as any).scaleY ?? 1;
  const { left, top } = fabricUtils.getObjectTopLeft(obj);

  const normPoint = (p: SelectionPoint) => ({
    x: (p.x - left) / scaleX,
    y: (p.y - top) / scaleY,
  });

  switch (shape.kind) {
    case "rect":
      return {
        kind: "rect",
        x: (shape.x - left) / scaleX,
        y: (shape.y - top) / scaleY,
        width: shape.width / scaleX,
        height: shape.height / scaleY,
      };

    case "ellipse":
      return {
        kind: "ellipse",
        cx: (shape.cx - left) / scaleX,
        cy: (shape.cy - top) / scaleY,
        rx: shape.rx / scaleX,
        ry: shape.ry / scaleY,
      };

    case "polygon":
    case "lasso":
      return {
        kind: shape.kind,
        points: shape.points.map(normPoint),
      };

    case "compound":
      return {
        kind: "compound",
        polygons: shape.polygons.map((poly) =>
          poly.map((ring) => ring.map(normPoint))
        ),
      };

    default:
      return shape;
  }
}




interface CanvasEditorProps {
  cropMode: CropMode;
  onChange?: () => void;
}

const CanvasEditor = forwardRef<EditorRef, CanvasEditorProps>(
  ({ cropMode, onChange }, ref) => {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const engineRef = useRef<CanvasEngine | null>(null);
    const toolsRef = useRef<ToolInstances | null>(null);
    const [workspaceSize, setWorkspaceSize] = useState<{
      width: number;
      height: number;
    } | null>(null);

    const changeHandlerRef = useRef<(() => void) | null>(null);
    const clipboardRef = useRef<ClipboardPayload | null>(null);
    const emitChange = () => changeHandlerRef.current?.();

    useEffect(() => {
      changeHandlerRef.current = onChange ?? null;
    }, [onChange]);

    const getImageDimensions = (img: FabricImage) => {
      const width =
        (img as any).width ??
        (typeof (img as any).getScaledWidth === "function"
          ? (img as any).getScaledWidth()
          : 0) ??
        img.getElement()?.width ??
        0;
      const height =
        (img as any).height ??
        (typeof (img as any).getScaledHeight === "function"
          ? (img as any).getScaledHeight()
          : 0) ??
        img.getElement()?.height ??
        0;
      return { width, height };
    };




    useImperativeHandle(ref, () => ({



      setTool(tool: ToolType) {
        const engine = engineRef.current;
        const tools = toolsRef.current;
        if (engine && tools) engine.setTool(tools[tool] ?? null, tool);
      },

      setSelectionSubtool(type: SelectionToolType) {
        const tools = toolsRef.current;
        if (tools?.selection) {
          tools.selection.setSubtool(type);
        }
      },

      setSelectionMode(mode: SelectionMode) {
        const tools = toolsRef.current;
        if (tools?.selection) {
          tools.selection.setMode(mode);
        }
        engineRef.current?.selection.setMode(mode);
      },

      invertSelection() {
        engineRef.current?.invertSelection();
      },

      confirmTool() {
        engineRef.current?.currentTool?.onConfirm();
      },

      cancelTool() {
        engineRef.current?.currentTool?.onCancel();
      },




      async loadImage(file: File) {
        const engine = engineRef.current;
        if (!engine) return;

        const uploader = new UploadTool(engine.canvas);
        const imgObj = await uploader.loadFromFile(file);
        const { width, height } = getImageDimensions(imgObj);
        if (!engine.isWorkspaceLocked() && width > 0 && height > 0) {
          engine.setWorkspaceSize(width, height);
          setWorkspaceSize({ width, height });
        }
        engine.resetZoom();
        imgObj.set({
          left: 0,
          top: 0,
          originX: "left",
          originY: "top",
          scaleX: 1,
          scaleY: 1,
        });
        imgObj.setCoords();
        engine.addLayer(imgObj, file.name);
        engine.canvas.renderAll();
        emitChange();
      },




      getClipboard() {
        return clipboardRef.current;
      },




      copySelection() {
        const engine = engineRef.current;
        if (!engine) return;

        const shape = engine.selection.getSelection();
        const active = engine.layers.getActiveLayer();
        if (!shape || !active) return;

        const src = getImageElement(active.object);
        if (!src) return;

        const normalized = selectionToImageSpace(shape, active.object);
        const rawMask = SelectionMaskRenderer.renderMask(normalized, src);
        const scaleX = (active.object as any).scaleX ?? 1;
        const scaleY = (active.object as any).scaleY ?? 1;
        const originX = (active.object as any).originX ?? "left";
        const originY = (active.object as any).originY ?? "top";
        const angle = (active.object as any).angle ?? 0;
        const opacity = (active.object as any).opacity ?? 1;

        clipboardRef.current = {
          canvas: rawMask,
          scaleX,
          scaleY,
          originX,
          originY,
          angle,
          opacity,
        };

        console.log("%c[Copy]", "color:#4bf");
      },




      cutSelection() {
        const engine = engineRef.current;
        if (!engine) return;

        const shape = engine.selection.getSelection();
        const active = engine.layers.getActiveLayer();
        if (!shape || !active) return;

        const src = getImageElement(active.object);
        if (!src) return;

        const id = active.id;

        const normalized = selectionToImageSpace(shape, active.object);
        const bbox = SelectionMaskRenderer.getBoundingRect(normalized);
        const scaleX = (active.object as any).scaleX ?? 1;
        const scaleY = (active.object as any).scaleY ?? 1;
        const originX = (active.object as any).originX ?? "center";
        const originY = (active.object as any).originY ?? "center";
        const { left: objLeft, top: objTop } = fabricUtils.getObjectTopLeft(
          active.object
        );
        const baseCenterLeft = (active.object as any).left ?? 0;
        const baseCenterTop = (active.object as any).top ?? 0;


        const cutMask = SelectionMaskRenderer.renderMask(normalized, src);
        clipboardRef.current = {
          canvas: cutMask,
          scaleX,
          scaleY,
          originX,
          originY,
          angle: (active.object as any).angle ?? 0,
          opacity: active.opacity,
        };


        const erased = SelectionMaskRenderer.eraseMask(normalized, src);

        const newImg = new FabricImage(erased, {
          left: baseCenterLeft,
          top: baseCenterTop,
          angle: (active.object as any).angle ?? 0,
          opacity: active.opacity,
          visible: active.visible,
          selectable: true,
          scaleX,
          scaleY,
          originX,
          originY,
        });

        engine.replaceLayer(id, newImg, active.name);
        emitChange();


        const pieceTopLeft = {
          left: objLeft + bbox.x * scaleX,
          top: objTop + bbox.y * scaleY,
        };
        const piecePosition = fabricUtils.toOriginPoint(
          pieceTopLeft,
          { width: cutMask.width ?? 0, height: cutMask.height ?? 0 },
          { originX, originY, scaleX, scaleY }
        );

        const pieceImg = new FabricImage(cutMask, {
          left: piecePosition.left,
          top: piecePosition.top,
          angle: (active.object as any).angle ?? 0,
          scaleX,
          scaleY,
          opacity: active.opacity,
          visible: active.visible,
          selectable: true,
          originX,
          originY,
        });
        engine.addLayer(pieceImg, `${active.name} piece`, active.id);
        emitChange();
      },




      deleteSelection() {
        const engine = engineRef.current;
        if (!engine) return;

        const shape = engine.selection.getSelection();
        const active = engine.layers.getActiveLayer();

        if (!shape || !active) {
          const layer = engine.layers.getActiveLayer();
          if (!layer) return;
          engine.removeLayer(layer.id);
          engine.selection.clear();
          engine.selectionOverlay.start();
          return;
        }

        const src = getImageElement(active.object);
        if (!src) return;

        const id = active.id;
        const normalized = selectionToImageSpace(shape, active.object);

        const erased = SelectionMaskRenderer.eraseMask(normalized, src);
        const originX = (active.object as any).originX ?? "center";
        const originY = (active.object as any).originY ?? "center";
        const scaleX = (active.object as any).scaleX ?? 1;
        const scaleY = (active.object as any).scaleY ?? 1;

        const newImg = new FabricImage(erased, {
          left: active.object.left,
          top: active.object.top,
          angle: (active.object as any).angle ?? 0,
          opacity: active.opacity,
          visible: active.visible,
          selectable: true,
          originX,
          originY,
          scaleX,
          scaleY,
        });

        engine.replaceLayer(id, newImg, active.name);
        engine.selection.clear();
        engine.selectionOverlay.start();
      },




      async pasteClipboard() {
        const engine = engineRef.current;
        if (!engine) return;

        const clip = clipboardRef.current;
        if (!clip) return;

        const dataUrl = clip.canvas.toDataURL();
        const img = await FabricImage.fromURL(dataUrl);
        img.set({
          left: 50,
          top: 50,
          originX: clip.originX,
          originY: clip.originY,
          scaleX: clip.scaleX,
          scaleY: clip.scaleY,
          angle: clip.angle,
          opacity: clip.opacity,
          selectable: true,
          visible: true,
        });

        engine.addLayer(img, "Pasted");
        emitChange();
      },




      getLayers() {
        return engineRef.current?.layers.getLayers() ?? [];
      },

      getActiveLayer() {
        return engineRef.current?.layers.getActiveLayer() ?? null;
      },

      selectLayer(id: string) {
        engineRef.current?.setActiveLayer(id);
      },

      setLayerVisibility(id: string, val: boolean) {
        engineRef.current?.setLayerVisibility(id, val);
      },

      setLayerOpacity(id: string, val: number) {
        engineRef.current?.setLayerOpacity(id, val);
      },

      moveLayerAbove(sourceId: string, targetId: string) {
        engineRef.current?.moveLayerAbove(sourceId, targetId);
      },

      deleteActiveLayer() {
        const engine = engineRef.current;
        if (!engine) return;

        const id = engine.layers.getActiveLayerId();
        if (id) engine.removeLayer(id);
      },




      getActiveLayerTransform() {
        return engineRef.current?.getActiveLayerTransform() ?? null;
      },

      setActiveLayerTransform(vals) {
        engineRef.current?.setActiveLayerTransform(vals);
      },

      zoomIn() {
        const engine = engineRef.current;
        if (!engine) return;
        engine.zoomIn();
      },

      zoomOut() {
        const engine = engineRef.current;
        if (!engine) return;
        engine.zoomOut();
      },

      resetZoom() {
        const engine = engineRef.current;
        if (!engine) return;
        engine.resetZoom();
      },

      undo() {
        engineRef.current?.undo();
        emitChange();
      },

      redo() {
        engineRef.current?.redo();
        emitChange();
      },

      exportMerged(format: ExportFormat) {
        return engineRef.current?.exportMerged(format) ?? Promise.resolve("");
      },

      exportLayers(format: ExportFormat) {
        return engineRef.current?.exportLayers(format) ?? Promise.resolve([]);
      },

      serializeState(): SerializedCanvasState | null {
        const engine = engineRef.current;
        if (!engine) return null;
        return engine.serializeState();
      },

      async restoreState(state: SerializedCanvasState) {
        const engine = engineRef.current;
        if (!engine) return;
        await engine.restoreState(state);
      },
    }));




    useEffect(() => {
      const el = canvasRef.current;
      if (!el) return;

      const engine = new CanvasEngine(el);
      engineRef.current = engine;

      const move = new MoveTool(engine);
      const selection = new SelectionTool(engine);
      const transform = new TransformTool(engine);

      const crop = new CropTool(
        engine,
        cropMode,
        (img) => engine.addLayer(img, "Cut Layer"),
        (img) => {
          const active = engine.layers.getActiveLayer();
          if (active) engine.replaceLayer(active.id, img);
        }
      );

      toolsRef.current = {
        move,
        crop,
        selection,
        transform,
      };

      engine.setTool(move, ToolType.Move);
      engine.setChangeHandler(() => {
        setWorkspaceSize((prev) => {
          if (prev) return prev;
          const w = engine.canvas.getWidth() ?? 0;
          const h = engine.canvas.getHeight() ?? 0;
          return w > 0 && h > 0 ? { width: w, height: h } : null;
        });
        changeHandlerRef.current?.();
      });


      engine.canvas.on("mouse:down", (evt: FabricPointerEvent) =>
        engine.currentTool?.onMouseDown(evt)
      );
      engine.canvas.on("mouse:move", (evt: FabricPointerEvent) =>
        engine.currentTool?.onMouseMove(evt)
      );
      engine.canvas.on("mouse:up", (evt: FabricPointerEvent) =>
        engine.currentTool?.onMouseUp(evt)
      );

      return () => {
        engine.setChangeHandler(null);
        engine.destroy();
      };
    }, [cropMode]);




    const wrapStyle =
      workspaceSize && workspaceSize.width > 0 && workspaceSize.height > 0
        ? {
            width: workspaceSize.width,
            height: workspaceSize.height,
          }
        : { width: "100%", height: "100%" };

    return (
      <div
        className="relative"
        style={{
          ...wrapStyle,
          backgroundColor: "#0f172a",
          boxShadow: "0 0 20px rgba(0,0,0,0.4)",
        }}
      >
        <canvas
          ref={canvasRef}
          className="block"
          style={{
            width:
              workspaceSize && workspaceSize.width > 0
                ? workspaceSize.width
                : "100%",
            height:
              workspaceSize && workspaceSize.height > 0
                ? workspaceSize.height
                : "100%",
          }}
        />
      </div>
    );
  }
);

export default CanvasEditor;
