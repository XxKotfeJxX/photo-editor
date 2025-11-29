import { useEffect, useState } from "react";

interface PropertiesPanelProps {
  transform: {
    x: number;
    y: number;
    width: number;
    height: number;
    angle: number;
    opacity: number;
  } | null;
  visible: boolean;
  onVisibleChange: (v: boolean) => void;
  onChange: (newValues: {
    x?: number;
    y?: number;
    width?: number;
    height?: number;
    angle?: number;
    opacity?: number;
  }) => void;
}

export function PropertiesPanel({
  transform,
  visible,
  onVisibleChange,
  onChange,
}: PropertiesPanelProps) {
  const round1 = (v: number) =>
    Number.isFinite(v) ? Number(v.toFixed(1)) : 0;

  const roundTransform = (t: typeof transform) =>
    t
      ? {
          ...t,
          x: round1(t.x),
          y: round1(t.y),
          width: round1(t.width),
          height: round1(t.height),
          angle: round1(t.angle),
          opacity: round1(t.opacity),
        }
      : null;

  const [local, setLocal] = useState(roundTransform(transform));

  useEffect(() => {
    setLocal(roundTransform(transform));
  }, [transform]);

  if (!local) {
    return (
      <div className="p-4 text-gray-400 text-sm">
        <div>No layer selected</div>
      </div>
    );
  }

  const update = (field: string, value: number) => {
    const v = isNaN(value) ? 0 : round1(value);
    setLocal({ ...local, [field]: v });
    onChange({ [field]: v });
  };

  return (
    <div className="p-4 text-gray-200 text-sm space-y-4">
      <div>
        <div className="mb-1 font-semibold text-gray-300">Position</div>
        <div className="grid grid-cols-2 gap-2">
          <label className="flex flex-col">
            <span className="text-xs text-gray-400">X</span>
            <input
              type="number"
              value={round1(local.x)}
              onChange={(e) => update("x", Number(e.target.value))}
              className="bg-gray-800 p-1 rounded"
            />
          </label>

          <label className="flex flex-col">
            <span className="text-xs text-gray-400">Y</span>
            <input
              type="number"
              value={round1(local.y)}
              onChange={(e) => update("y", Number(e.target.value))}
              className="bg-gray-800 p-1 rounded"
            />
          </label>
        </div>
      </div>

      <div>
        <div className="mb-1 font-semibold text-gray-300">Size</div>
        <div className="grid grid-cols-2 gap-2">
          <label className="flex flex-col">
            <span className="text-xs text-gray-400">Width</span>
            <input
              type="number"
              value={round1(local.width)}
              onChange={(e) => update("width", Number(e.target.value))}
              className="bg-gray-800 p-1 rounded"
            />
          </label>

          <label className="flex flex-col">
            <span className="text-xs text-gray-400">Height</span>
            <input
              type="number"
              value={round1(local.height)}
              onChange={(e) => update("height", Number(e.target.value))}
              className="bg-gray-800 p-1 rounded"
            />
          </label>
        </div>
      </div>

      <div>
        <div className="mb-1 font-semibold text-gray-300">Rotation</div>
        <input
          type="number"
          value={round1(local.angle)}
          onChange={(e) => update("angle", Number(e.target.value))}
          className="bg-gray-800 p-1 rounded w-full"
        />
      </div>

      <div>
        <div className="mb-1 font-semibold text-gray-300">Opacity</div>
        <input
          type="range"
          min={0}
          max={100}
          value={local.opacity * 100}
          onChange={(e) => update("opacity", Number(e.target.value) / 100)}
          className="w-full"
        />
        <div className="text-xs text-gray-400 mt-1">
          {Math.round(local.opacity * 100)}%
        </div>
      </div>

      <div>
        <label className="flex items-center gap-2 text-gray-300 font-semibold">
          <input
            type="checkbox"
            checked={visible}
            onChange={(e) => onVisibleChange(e.target.checked)}
          />
          Visible
        </label>
      </div>
    </div>
  );
}
