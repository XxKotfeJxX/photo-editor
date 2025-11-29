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
  onClose: () => void;
  onConfirm: () => void;
  onBrowse: () => void;
  browseSupported: boolean;
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
  onClose,
  onConfirm,
  onBrowse,
  browseSupported,
}: SaveAsDialogProps) {
  if (!open) return null;

  const { merge, layers, format } = options;

  const disabled = !merge && !layers;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 px-4">
      <div className="w-[520px] bg-[#0f172a] text-white rounded-2xl shadow-2xl border border-white/10 overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-blue-600/20 to-transparent border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="h-2 w-10 rounded-full bg-blue-500/70" />
            <h2 className="text-xl font-semibold tracking-wide">Save as</h2>
          </div>
          <button
            className="text-gray-300 hover:text-white transition-colors"
            onClick={onClose}
            aria-label="Close"
          >
            X
          </button>
        </div>

        <div className="px-6 py-5 space-y-5">
          <div className="space-y-4 rounded-xl bg-white/5 border border-white/5 p-4">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={merge}
                onChange={(e) =>
                  onOptionsChange({ ...options, merge: e.target.checked })
                }
                className="mt-1 h-4 w-4 accent-blue-500"
              />
              <div>
                <div className="font-semibold text-lg">Save as single image</div>
                <div className="text-xs text-gray-400">
                  Export the full canvas as one file.
                </div>
              </div>
            </label>

            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={layers}
                onChange={(e) =>
                  onOptionsChange({ ...options, layers: e.target.checked })
                }
                className="mt-1 h-4 w-4 accent-blue-500"
              />
              <div>
                <div className="font-semibold text-lg">
                  Save each layer separately
                </div>
                <div className="text-xs text-gray-400">
                  Creates one file per layer.
                </div>
              </div>
            </label>
          </div>

          <div className="space-y-2">
            <div className="text-sm text-gray-300">Format</div>
            <select
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={format}
              onChange={(e) =>
                onOptionsChange({
                  ...options,
                  format: e.target.value as ExportFormat,
                })
              }
            >
              {formatLabels.map((f) => (
                <option key={f.value} value={f.value} className="bg-gray-800">
                  {f.label}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <div className="text-sm text-gray-300">Preview</div>
            <div className="bg-[#0b1220] border border-white/5 rounded-xl h-52 flex items-center justify-center overflow-hidden">
              {previewUrl ? (
                <img
                  src={previewUrl}
                  alt="Preview"
                  className="max-h-full max-w-full object-contain"
                />
              ) : (
                <div className="text-gray-500 text-sm">Preview unavailable</div>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between gap-3 flex-wrap pt-2">
            <div className="flex items-center gap-2 text-xs text-gray-400">
              {!browseSupported && (
                <span className="px-2 py-1 rounded-full bg-white/5 border border-white/10 text-gray-300">
                  Picker not available — will fallback to download.
                </span>
              )}
            </div>
            <div className="flex items-center gap-3">
              <button
                className="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-gray-200 transition-colors"
                onClick={onClose}
              >
                Cancel
              </button>
              <button
                className={`px-4 py-2 rounded-lg ${
                  disabled
                    ? "bg-white/5 text-gray-500 cursor-not-allowed"
                    : "bg-blue-600 hover:bg-blue-500"
                }`}
                onClick={onBrowse}
                disabled={disabled}
              >
                Browse...
              </button>
              <button
                className={`px-5 py-2 rounded-lg font-semibold shadow ${
                  disabled
                    ? "bg-white/5 text-gray-500 cursor-not-allowed"
                    : "bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-500/90 hover:to-cyan-500/90"
                }`}
                onClick={onConfirm}
                disabled={disabled}
              >
                Save
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
