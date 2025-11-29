export function readFileAsDataURL(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      if (typeof reader.result === "string") resolve(reader.result);
      else reject(new Error("Unexpected FileReader result type"));
    };

    reader.onerror = () =>
      reject(reader.error ?? new Error("Unknown FileReader error"));

    reader.readAsDataURL(file);
  });
}

export function dataURLToBlob(dataURL: string): Blob {
  const arr = dataURL.split(",");
  const mimeMatch = arr[0].match(/:(.*?);/);

  if (!mimeMatch) throw new Error("Invalid dataURL");

  const mime = mimeMatch[1];
  const bstr = atob(arr[1]);
  const len = bstr.length;
  const u8 = new Uint8Array(len);

  for (let i = 0; i < len; i++) {
    u8[i] = bstr.charCodeAt(i);
  }
  return new Blob([u8], { type: mime });
}

export function blobToFile(blob: Blob, name: string): File {
  return new File([blob], name, { type: blob.type });
}
