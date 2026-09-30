/** Reading text out of uploaded files, and finding the passages that matter for a question. */

export const MAX_TEXT = 150_000;
/** Only these kinds of documents are ever shown to the assistant. School paperwork can hold contact details, so it is left out. */
export const READABLE_CATEGORIES = ["playbook", "scouting", "practice"] as const;
export const isReadableCategory = (c: string) => (READABLE_CATEGORIES as readonly string[]).includes(c);
export const READABLE_EXTENSIONS = ["pdf", "docx", "txt", "md", "csv"] as const;
export const canReadMime = (mime: string) => mime === "application/pdf" || mime === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" || mime.startsWith("text/");
export const canRead = (ext: string) => (READABLE_EXTENSIONS as readonly string[]).includes(ext);

/** Phone numbers and email addresses never leave the app, even inside a playbook. */
export function redact(text: string): string {
  return text
    .replace(/[\w.+-]+@[\w-]+(?:\.[\w-]+)+/g, "[email removed]")
    .replace(/(?:\+?1[\s.-]?)?\(?\b\d{3}\)?[\s.-]\d{3}[\s.-]\d{4}\b/g, "[phone removed]");
}

export function tidy(text: string): string {
  return text.replace(/\r\n?/g, "\n").replace(/[ \t]+\n/g, "\n").replace(/\n{3,}/g, "\n\n").replace(/[ \t]{2,}/g, " ").trim();
}

export type Extracted = { ok: true; text: string; truncated: boolean } | { ok: false; reason: "unsupported" | "empty" | "failed"; message: string };

export async function extractText(bytes: Uint8Array, ext: string): Promise<Extracted> {
  try {
    let raw = "";
    if (ext === "pdf") {
      const { extractText: pdfText, getDocumentProxy } = await import("unpdf");
      const pdf = await getDocumentProxy(bytes);
      raw = (await pdfText(pdf, { mergePages: true })).text;
    } else if (ext === "docx") {
      const mammoth = await import("mammoth");
      raw = (await mammoth.extractRawText({ buffer: Buffer.from(bytes) })).value;
    } else if (ext === "txt" || ext === "md" || ext === "csv") {
      raw = new TextDecoder("utf-8").decode(bytes);
    } else {
      return { ok: false, reason: "unsupported", message: "The assistant can read PDF, Word (.docx), text, Markdown and CSV files." };
    }
    const text = tidy(raw);
    if (text.length < 20) return { ok: false, reason: "empty", message: "No text found. It may be a scan or a photo of a page." };
    return { ok: true, text: text.slice(0, MAX_TEXT), truncated: text.length > MAX_TEXT };
  } catch (e) {
    return { ok: false, reason: "failed", message: `Could not read the file${e instanceof Error ? `: ${e.message}` : "."}` };
  }
}

export type Chunk = { docId: string; docName: string; n: number; text: string };

/** Splits a document into passages of about `size` characters, breaking at paragraph or line ends where it can. */
export function chunkText(docId: string, docName: string, text: string, size = 1100): Chunk[] {
  const out: Chunk[] = [];
  let cur = "";
  const push = () => { if (cur.trim()) out.push({ docId, docName, n: out.length + 1, text: cur.trim() }); cur = ""; };
  for (const para of text.split(/\n{2,}/)) {
    if (para.length > size) {
      push();
      for (let i = 0; i < para.length; i += size) { cur = para.slice(i, i + size); push(); }
      continue;
    }
    if ((cur + "\n\n" + para).length > size) push();
    cur = cur ? `${cur}\n\n${para}` : para;
  }
  push();
  return out;
}

const STOP = new Set("the a an and or of to in on for with is are was were be been it this that at by from as we our what which who how when where do does did can should would about over any all".split(" "));
const words = (s: string) => s.toLowerCase().match(/[a-z0-9']{2,}/g)?.filter((w) => !STOP.has(w)) ?? [];

/** The best passages for a question, by how many of its words they contain (rarer words count for more). */
export function topChunks(question: string, chunks: Chunk[], limit: number, budget: number): Chunk[] {
  const q = [...new Set(words(question))];
  if (q.length === 0 || chunks.length === 0) return [];
  const docFreq = new Map(q.map((w) => [w, chunks.filter((c) => c.text.toLowerCase().includes(w)).length]));
  const scored = chunks.map((c) => {
    const lower = c.text.toLowerCase();
    const score = q.reduce((s, w) => (lower.includes(w) ? s + Math.log(1 + chunks.length / (1 + (docFreq.get(w) ?? 0))) : s), 0);
    return { c, score };
  }).filter((x) => x.score > 0).sort((a, b) => b.score - a.score);
  const out: Chunk[] = [];
  let used = 0;
  for (const { c } of scored) {
    if (out.length >= limit || used + c.text.length > budget) continue;
    out.push(c); used += c.text.length;
  }
  return out.sort((a, b) => a.docName.localeCompare(b.docName) || a.n - b.n);
}
