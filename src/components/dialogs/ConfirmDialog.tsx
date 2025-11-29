interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-gray-800 p-6 rounded shadow-xl w-96 text-white">
        <h2 className="text-lg mb-3">{title}</h2>
        <p className="mb-6 text-gray-300">{message}</p>

        <div className="flex justify-end gap-3">
          <button
            onClick={onCancel}
            className="bg-gray-600 hover:bg-gray-500 px-4 py-2 rounded"
          >
            {cancelLabel}
          </button>

          <button
            onClick={onConfirm}
            className="bg-blue-600 hover:bg-blue-500 px-4 py-2 rounded"
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
