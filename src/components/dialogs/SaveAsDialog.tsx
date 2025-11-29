import type { ExportFormat } from "../../core/canvas/types/ExportFormat";

interface SaveAsOptions {
  merge: boolean;
  layers: boolean;
  format: ExportFormat;
}

interface SaveAsDialogProps {
  open: boolean;
  options: SaveAsOptions;
  previewUrl: string | null;
  onOptionsChange: (opts: SaveAsOptions) => void;
  directorySupported?: boolean;
  directoryLabel?: string;
  onPickDirectory?: () => void;
  onClose: () => void;
  onConfirm: () => void;
}

const formatLabels: { value: ExportFormat; label: string }[] = [
  { value: "png", label: "PNG" },
  { value: "jpg", label: "JPG" },
  { value: "webp", label: "WEBP" },
  { value: "svg", label: "SVG" },
];

export function SaveAsDialog({
  open,
  options,
  previewUrl,
  onOptionsChange,
  directorySupported = true,
  directoryLabel,
  onPickDirectory,
  onClose,
  onConfirm,
}: SaveAsDialogProps) {
  if (!open) return null;

  const { merge, layers, format } = options;

  const disabled = !merge && !layers;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-gray-800 p-6 rounded shadow-xl w-[480px] text-white space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Save as</h2>
          <button
            className="text-gray-300 hover:text-white"
            onClick={onClose}
            aria-label="Close"
          >
            X
          </button>
        </div>

        <div className="space-y-3">
          <label className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={merge}
              onChange={(e) =>
                onOptionsChange({ ...options, merge: e.target.checked })
              }
            />
            <div>
              <div className="font-medium">Save as single image</div>
              <div className="text-xs text-gray-400">
                Export the full canvas as one file.
              </div>
            </div>
          </label>

          <label className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={layers}
              onChange={(e) =>
                onOptionsChange({ ...options, layers: e.target.checked })
              }
            />
            <div>
              <div className="font-medium">Save each layer separately</div>
              <div className="text-xs text-gray-400">
                Creates one file per layer.
              </div>
            </div>
          </label>

          <div className="flex items-center gap-3">
            <div className="w-32 text-sm text-gray-300">Format</div>
            <select
              className="flex-1 bg-gray-700 p-2 rounded text-white"
              value={format}
              onChange={(e) =>
                onOptionsChange({
                  ...options,
                  format: e.target.value as ExportFormat,
                })
              }
            >
              {formatLabels.map((f) => (
                <option key={f.value} value={f.value}>
                  {f.label}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-32 text-sm text-gray-300">Folder</div>
            <div className="flex-1 flex items-center gap-2">
              <div className="flex-1 bg-gray-700 text-gray-200 text-sm rounded px-2 py-2 truncate">
                {directoryLabel || "Not selected"}
              </div>
              <button
                className="bg-gray-700 hover:bg-gray-600 px-3 py-2 rounded text-sm"
                onClick={onPickDirectory}
                type="button"
                disabled={!directorySupported}
              >
                Browse
              </button>
            </div>
            {!directorySupported && (
              <div className="text-xs text-red-300 ml-32">
                Folder selection requires a Chromium-based browser (e.g. Chrome/Edge) over HTTPS.
              </div>
            )}
          </div>
        </div>

        <div className="space-y-2">
          <div className="text-sm text-gray-300">Preview</div>
          <div className="bg-gray-900 border border-gray-700 rounded h-48 flex items-center justify-center overflow-hidden">
            {previewUrl ? (
              <img
                src={previewUrl}
                alt="Preview"
                className="max-h-48 max-w-full object-contain"
              />
            ) : (
              <div className="text-gray-500 text-sm">Preview unavailable</div>
            )}
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <button
            className="bg-gray-600 hover:bg-gray-500 px-4 py-2 rounded"
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            className={`px-4 py-2 rounded ${
              disabled
                ? "bg-gray-700 text-gray-400 cursor-not-allowed"
                : "bg-blue-600 hover:bg-blue-500"
            }`}
            onClick={onConfirm}
            disabled={disabled}
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
