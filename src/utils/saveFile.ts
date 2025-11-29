export type DownloadableFile = {
  name: string;
  extension: string;
  blob: Blob;
};

export type SaveResult = "picker" | "download" | "aborted" | "unsupported";

type FileSystemWritableFileStream = {
  write: (data: Blob) => Promise<void>;
  close: () => Promise<void>;
};

type FileHandle = {
  createWritable: () => Promise<FileSystemWritableFileStream>;
};

type DirectoryHandle = {
  getFileHandle: (
    name: string,
    options?: { create?: boolean }
  ) => Promise<FileHandle>;
};

type SavePicker = (options?: {
  suggestedName?: string;
  types?: { description?: string; accept?: Record<string, string[]> }[];
}) => Promise<FileHandle>;

type DirectoryPicker = () => Promise<DirectoryHandle>;

type FileSystemWindow = Window & {
  showSaveFilePicker?: SavePicker;
  showDirectoryPicker?: DirectoryPicker;
};

export const getPickerSupport = (): {
  save: boolean;
  directory: boolean;
  any: boolean;
} => {
  if (typeof window === "undefined") {
    return { save: false, directory: false, any: false };
  }
  const fsWindow = window as FileSystemWindow;
  const save = typeof fsWindow.showSaveFilePicker === "function";
  const directory = typeof fsWindow.showDirectoryPicker === "function";
  return { save, directory, any: save || directory };
};

export const dataUrlToBlobSafe = async (dataUrl: string): Promise<Blob> => {
  const res = await fetch(dataUrl);
  return res.blob();
};

const mimeFromExtension = (ext: string): string => {
  if (ext === "jpg" || ext === "jpeg") return "image/jpeg";
  if (ext === "png") return "image/png";
  if (ext === "webp") return "image/webp";
  if (ext === "svg") return "image/svg+xml";
  return "application/octet-stream";
};

const isAbortError = (error: unknown): boolean => {
  if (error instanceof DOMException) {
    return error.name === "AbortError" || error.name === "NotAllowedError";
  }
  return false;
};

const writeHandle = async (handle: FileHandle, blob: Blob): Promise<void> => {
  const writable = await handle.createWritable();
  await writable.write(blob);
  await writable.close();
};

const tryFileSystemSave = async (
  files: DownloadableFile[]
): Promise<"saved" | "aborted" | "unsupported" | "failed"> => {
  if (typeof window === "undefined") return "unsupported";

  const fsWindow = window as FileSystemWindow;
  const hasSavePicker = typeof fsWindow.showSaveFilePicker === "function";
  const hasDirPicker = typeof fsWindow.showDirectoryPicker === "function";

  if (!hasSavePicker && !hasDirPicker) {
    return "unsupported";
  }

  try {
    if (files.length === 1 && hasSavePicker) {
      const file = files[0];
      const handle = await fsWindow.showSaveFilePicker!({
        suggestedName: `${file.name}.${file.extension}`,
        types: [
          {
            description: `${file.extension.toUpperCase()} file`,
            accept: {
              [mimeFromExtension(file.extension)]: [
                `.${file.extension}`,
              ],
            },
          },
        ],
      });
      await writeHandle(handle, file.blob);
      return "saved";
    }

    if (files.length > 1 && hasDirPicker) {
      const dir = await fsWindow.showDirectoryPicker!();
      for (const file of files) {
        const handle = await dir.getFileHandle(
          `${file.name}.${file.extension}`,
          { create: true }
        );
        await writeHandle(handle, file.blob);
      }
      return "saved";
    }

    if (files.length > 1 && hasSavePicker) {
      for (const file of files) {
        const handle = await fsWindow.showSaveFilePicker!({
          suggestedName: `${file.name}.${file.extension}`,
          types: [
            {
              description: `${file.extension.toUpperCase()} file`,
              accept: {
                [mimeFromExtension(file.extension)]: [
                  `.${file.extension}`,
                ],
              },
            },
          ],
        });
        await writeHandle(handle, file.blob);
      }
      return "saved";
    }

    return "unsupported";
  } catch (error) {
    if (isAbortError(error)) return "aborted";
    return "failed";
  }
};

const downloadWithAnchor = (files: DownloadableFile[]): void => {
  files.forEach((file, idx) => {
    const url = URL.createObjectURL(file.blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${file.name || `export-${idx + 1}`}.${
      file.extension
    }`;
    link.style.display = "none";
    document.body.appendChild(link);
    link.click();
    setTimeout(() => {
      URL.revokeObjectURL(url);
      link.remove();
    }, 0);
  });
};

export async function saveFilesToDisk(
  files: DownloadableFile[],
  options?: {
    allowPicker?: boolean;
    skipDownloadOnAbort?: boolean;
    fallbackOnUnsupported?: boolean;
  }
): Promise<SaveResult> {
  if (!files.length) return "aborted";

  const allowPicker = options?.allowPicker ?? true;
  const fallbackOnUnsupported = options?.fallbackOnUnsupported ?? true;
  if (allowPicker) {
    const pickerResult = await tryFileSystemSave(files);
    if (pickerResult === "saved") return "picker";
    if (pickerResult === "aborted" && options?.skipDownloadOnAbort) {
      return "aborted";
    }
    if (pickerResult === "unsupported" && !fallbackOnUnsupported) {
      return "unsupported";
    }
    if (pickerResult === "failed" && !fallbackOnUnsupported) {
      return "unsupported";
    }
  }

  downloadWithAnchor(files);
  return "download";
}
