import { useEffect } from "react";

interface HotkeyHandlers {
  open?: () => void;
  toolMove?: () => void;
  toolSelect?: () => void;
  toolCrop?: () => void;
  zoomIn?: () => void;
  zoomOut?: () => void;
  quickSave?: () => void;
  saveAs?: () => void;
  copy?: () => void;
  cut?: () => void;
  paste?: () => void;
  remove?: () => void;
  undo?: () => void;
  redo?: () => void;
  invertSelection?: () => void;
  confirm?: () => void;
  cancel?: () => void;
  switchCropMode?: () => void;
}

export function useHotkeys(handlers: HotkeyHandlers): void {
  useEffect(() => {
    const fn = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (["INPUT", "TEXTAREA"].includes(target.tagName) ||
          target.getAttribute("contenteditable") === "true")
      ) {
        return;
      }

      const isMod = e.ctrlKey || e.metaKey;
      const code = e.code;
      const key = e.key.toLowerCase();

      if (isMod) {
        if (code === "KeyS" && e.shiftKey) {
          e.preventDefault();
          e.stopPropagation();
          handlers.saveAs?.();
          return;
        }

        if (code === "KeyS") {
          e.preventDefault();
          e.stopPropagation();
          handlers.quickSave?.();
          return;
        }

        if (
          code === "Equal" ||
          code === "NumpadAdd" ||
          key === "+" ||
          key === "="
        ) {
          e.preventDefault();
          e.stopPropagation();
          handlers.zoomIn?.();
          return;
        }

        if (
          code === "Minus" ||
          code === "NumpadSubtract" ||
          key === "-"
        ) {
          e.preventDefault();
          e.stopPropagation();
          handlers.zoomOut?.();
          return;
        }

        if (code === "KeyO") {
          e.preventDefault();
          e.stopPropagation();
          handlers.open?.();
          return;
        }

        if (code === "KeyC") {
          e.preventDefault();
          e.stopPropagation();
          handlers.copy?.();
          return;
        }

        if (code === "KeyX") {
          e.preventDefault();
          e.stopPropagation();
          handlers.cut?.();
          return;
        }

        if (code === "KeyV") {
          e.preventDefault();
          e.stopPropagation();
          handlers.paste?.();
          return;
        }

        if (code === "KeyZ") {
          e.preventDefault();
          e.stopPropagation();
          handlers.undo?.();
          return;
        }

        if (code === "KeyY") {
          e.preventDefault();
          e.stopPropagation();
          handlers.redo?.();
          return;
        }
      }

      if (!isMod && code === "KeyM") handlers.toolMove?.();
      if (!isMod && code === "KeyS") handlers.toolSelect?.();
      if (!isMod && code === "KeyC") handlers.toolCrop?.();
      if (
        key === "delete" ||
        code === "Delete" ||
        key === "backspace" ||
        code === "Backspace"
      ) {
        handlers.remove?.();
      }
      if (!isMod && key === "i") handlers.invertSelection?.();
      if (key === "enter") handlers.confirm?.();
      if (key === "escape") handlers.cancel?.();
      if (!isMod && key === "f") handlers.switchCropMode?.();
    };

    window.addEventListener("keydown", fn, { capture: true });
    return () => window.removeEventListener("keydown", fn, true);
  }, [handlers]);
}
