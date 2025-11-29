export type ExportFormat = "png" | "jpg" | "jpeg" | "webp" | "svg";

export const normalizeExportFormat = (format: ExportFormat): ExportFormat => {
  if (format === "jpg") return "jpg";
  if (format === "jpeg") return "jpg";
  if (format === "webp") return "webp";
  if (format === "svg") return "svg";
  return "png";
};
