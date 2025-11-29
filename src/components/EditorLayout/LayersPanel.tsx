interface LayerEntry {
  id: string;
  name: string;
  visible: boolean;
}

interface LayersPanelProps {
  layers: LayerEntry[];
  activeLayerId: string | null;
  onSelect: (id: string) => void;
  onToggle: (id: string, visible: boolean) => void;
  onReorder: (sourceId: string, targetId: string) => void;
}

export function LayersPanel({
  layers,
  activeLayerId,
  onSelect,
  onToggle,
  onReorder,
}: LayersPanelProps) {
  const viewLayers = [...layers].reverse();

  const handleDrop = (sourceId: string, targetId: string) => {
    if (!sourceId || !targetId || sourceId === targetId) return;
    onReorder(sourceId, targetId);
  };

  return (
    <div className="p-3 text-white space-y-2">
      <h3 className="text-sm uppercase text-gray-400 mb-2">Layers</h3>

      {viewLayers.map((l) => (
        <div
          key={l.id}
          className={`flex justify-between items-center p-2 rounded cursor-pointer ${
            l.id === activeLayerId ? "bg-gray-700" : "bg-gray-800"
          } hover:bg-gray-700`}
          draggable
          onDragStart={(e) => {
            e.dataTransfer.setData("text/layer-id", l.id);
            e.dataTransfer.effectAllowed = "move";
          }}
          onDragOver={(e) => {
            e.preventDefault();
            e.dataTransfer.dropEffect = "move";
          }}
          onDrop={(e) => {
            e.preventDefault();
            const sourceId = e.dataTransfer.getData("text/layer-id");
            handleDrop(sourceId, l.id);
          }}
          onClick={() => onSelect(l.id)}
        >
          <span>{l.name}</span>

          <button
            className="text-gray-300 hover:text-white"
            onClick={(e) => {
              e.stopPropagation();
              onToggle(l.id, !l.visible);
            }}
          >
            {l.visible ? "Hide" : "Show"}
          </button>
        </div>
      ))}
    </div>
  );
}
