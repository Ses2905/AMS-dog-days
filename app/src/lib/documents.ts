export const CATEGORIES = [
  { value: "playbook", label: "Playbook" },
  { value: "scouting", label: "Scouting" },
  { value: "practice", label: "Practice" },
  { value: "school", label: "School" },
  { value: "other", label: "Other" },
] as const;
export type Category = (typeof CATEGORIES)[number]["value"];

export const MAX_BYTES = 25 * 1024 * 1024;

/** Allowed file types, by extension. The extension decides the type, not whatever the browser claims. */
export const TYPES: Record<string, string> = {
  pdf: "application/pdf",
  doc: "application/msword",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  xls: "application/vnd.ms-excel",
  xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  ppt: "application/vnd.ms-powerpoint",
  pptx: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  txt: "text/plain",
  md: "text/markdown",
  csv: "text/csv",
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  webp: "image/webp",
  heic: "image/heic",
  heif: "image/heif",
};
export const ACCEPT = Object.keys(TYPES).map((e) => `.${e}`).join(",");

export const extensionOf = (filename: string) => {
  const i = filename.lastIndexOf(".");
  return i > 0 && i < filename.length - 1 ? filename.slice(i + 1).toLowerCase() : "";
};

/** "Pea Ridge Scout Report.pdf" -> "Pea Ridge Scout Report" */
export const displayName = (filename: string) => (filename.replace(/\.[^.]+$/, "").replace(/[_]+/g, " ").replace(/\s+/g, " ").trim() || "Untitled").slice(0, 120);

/** Storage-safe file name: plain letters, numbers, dots and dashes only. */
export const safeFileName = (filename: string) => {
  const ext = extensionOf(filename);
  const base = filename.replace(/\.[^.]+$/, "").normalize("NFKD").replace(/[̀-ͯ]/g, "").replace(/[^a-zA-Z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 60) || "file";
  return ext ? `${base}.${ext}` : base;
};

export type UploadRequest = { filename: string; size: number; category: Category; gameId: string | null; practiceId: string | null; name: string };

export function parseUploadRequest(input: unknown): { ok: true; value: UploadRequest } | { ok: false; error: string } {
  if (typeof input !== "object" || input === null) return { ok: false, error: "Nothing to upload." };
  const p = input as Record<string, unknown>;
  const filename = typeof p.filename === "string" ? p.filename.trim() : "";
  if (!filename || filename.length > 200) return { ok: false, error: "That file name isn't valid." };
  const ext = extensionOf(filename);
  if (!TYPES[ext]) return { ok: false, error: `Files ending in “.${ext || "?"}” aren't supported. Try PDF, Word, Excel, PowerPoint, text or a photo.` };
  const size = p.size;
  if (typeof size !== "number" || !Number.isInteger(size) || size <= 0) return { ok: false, error: "That file looks empty." };
  if (size > MAX_BYTES) return { ok: false, error: `That file is ${formatSize(size)}. The limit is ${formatSize(MAX_BYTES)}.` };
  const category = p.category as Category;
  if (!CATEGORIES.some((c) => c.value === category)) return { ok: false, error: "Pick a category." };
  const opt = (v: unknown) => (typeof v === "string" && v.trim() && v.length <= 120 ? v.trim() : null);
  const name = (typeof p.name === "string" ? p.name.trim() : "") || displayName(filename);
  if (name.length > 120) return { ok: false, error: "The name is too long (max 120 characters)." };
  return { ok: true, value: { filename, size, category, gameId: opt(p.gameId), practiceId: opt(p.practiceId), name } };
}

export function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(bytes < 10 * 1024 * 1024 ? 1 : 0)} MB`;
}

export const kindOf = (mime: string) => (mime.startsWith("image/") ? "Photo" : mime === "application/pdf" ? "PDF" : mime.includes("word") ? "Word" : mime.includes("sheet") || mime.includes("excel") || mime === "text/csv" ? "Sheet" : mime.includes("presentation") || mime.includes("powerpoint") ? "Slides" : "Text");
