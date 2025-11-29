interface ExportDialogProps {
  open: boolean;
  onClose: () => void;
  onExport: (format: "png" | "jpg") => void;
}

export function ExportDialog({ open, onClose, onExport }: ExportDialogProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-gray-800 p-6 rounded shadow-xl w-80 text-white">
        <h2 className="text-lg mb-4">Export</h2>

        <div className="flex flex-col gap-3">
          <button
            className="bg-blue-600 hover:bg-blue-500 px-4 py-2 rounded"
            onClick={() => {
              onExport("png");
              onClose();
            }}
          >
            PNG
          </button>

          <button
            className="bg-green-600 hover:bg-green-500 px-4 py-2 rounded"
            onClick={() => {
              onExport("jpg");
              onClose();
            }}
          >
            JPG
          </button>
        </div>

        <button
          className="mt-4 bg-gray-600 hover:bg-gray-500 px-4 py-2 rounded w-full"
          onClick={onClose}
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
