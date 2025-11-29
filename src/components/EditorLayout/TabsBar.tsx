import type { Tab } from "../../core/Tab";

interface TabsBarProps {
  tabs: Tab[];
  activeId: string | null;
  onSelect: (id: string) => void;
  onClose: (id: string) => void;
}

export function TabsBar({ tabs, activeId, onSelect, onClose }: TabsBarProps) {
  return (
    <div className="h-8 bg-gray-800 text-white flex items-center border-b border-gray-700 select-none">
      {tabs.map((t) => (
        <div
          key={t.id}
          className={`px-3 py-1 flex items-center gap-2 cursor-pointer border-r border-gray-700 ${
            activeId === t.id ? "bg-gray-700" : "bg-gray-800 hover:bg-gray-700"
          }`}
          onClick={() => onSelect(t.id)}
        >
          <span className="text-sm truncate max-w-[150px]">
            {t.name || "Untitled"}
          </span>
          <button
            className="text-xs text-gray-300 hover:text-white"
            onClick={(e) => {
              e.stopPropagation();
              onClose(t.id);
            }}
          >
            X
          </button>
        </div>
      ))}
    </div>
  );
}
