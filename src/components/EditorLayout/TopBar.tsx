import { useEffect, useRef, useState } from "react";

type MenuKey = "file" | "edit" | "view" | null;

const menus: Record<
  Exclude<MenuKey, null>,
  { label: string; items: { label: string; onClick?: () => void }[] }
> = {
  file: {
    label: "File",
    items: [
      { label: "Save" },
      { label: "Save as" },
      { label: "Settings" },
    ],
  },
  edit: { label: "Edit", items: [{ label: "Undo" }, { label: "Redo" }] },
  view: {
    label: "View",
    items: [
      { label: "Zoom in" },
      { label: "Zoom out" },
      { label: "Reset zoom" },
    ],
  },
};

interface TopBarProps {
  onZoomIn: () => void;
  onZoomOut: () => void;
  onResetZoom: () => void;
  onUndo: () => void;
  onRedo: () => void;
  onSaveAs: () => void;
  onSave: () => void;
}

export function TopBar({
  onZoomIn,
  onZoomOut,
  onResetZoom,
  onUndo,
  onRedo,
  onSaveAs,
  onSave,
}: TopBarProps) {
  const [open, setOpen] = useState<MenuKey>(null);
  const barRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (!barRef.current) return;
      if (barRef.current.contains(e.target as Node)) return;
      setOpen(null);
    };
    window.addEventListener("mousedown", handler, true);
    return () => window.removeEventListener("mousedown", handler, true);
  }, []);

  return (
    <div
      ref={barRef}
      className="
        relative h-12 
        bg-gray-900 text-white 
        flex items-center 
        px-6 
        select-none 
        shadow-md shadow-black/25
      "
    >
      {/* ЛОГО ЗЛІВА */}
      <span className="font-semibold tracking-wide text-base text-gray-100 uppercase">
        PageCutter
      </span>

      {/* МЕНЮ ПО ЦЕНТРУ */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="flex items-center gap-2">
          {(Object.keys(menus) as Array<Exclude<MenuKey, null>>).map((key) => {
            const isOpen = open === key;
            return (
              <div key={key} className="relative">
                <button
                  className={`
                    px-4 py-2 
                    text-sm font-medium rounded-md 
                    bg-gray-800/70 
                    hover:bg-gray-700 
                    transition-colors
                    ${isOpen ? "bg-gray-700" : ""}
                  `}
                  onClick={() => setOpen(isOpen ? null : key)}
                >
                  {menus[key].label}
                </button>

                {isOpen && (
                  <div
                    className="
                      absolute left-0 top-full mt-2 
                      w-48 
                      bg-gray-900 
                      border border-gray-700 
                      rounded-md 
                      shadow-xl 
                      overflow-hidden 
                      z-50
                    "
                  >
                    {menus[key].items.map((item) => (
                      <button
                        key={item.label}
                        className="
                          w-full text-left px-4 py-2 
                          text-sm text-gray-100 
                          hover:bg-gray-700 
                          transition-colors
                        "
                        onClick={() => {
                          setOpen(null);
                          if (item.label === "Undo") onUndo();
                          if (item.label === "Redo") onRedo();
                          if (item.label === "Zoom in") onZoomIn();
                          if (item.label === "Zoom out") onZoomOut();
                          if (item.label === "Reset zoom") onResetZoom();
                          if (item.label === "Save") onSave();
                          if (item.label === "Save as") onSaveAs();
                          item.onClick?.();
                        }}
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* ПУСТОТА СПРАВА */}
      <div className="flex-1" />
    </div>
  );
}
