"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { canRead, extractText } from "@/lib/doc-text";
import { CATEGORIES, TYPES, extensionOf, parseUploadRequest, safeFileName, type UploadRequest } from "@/lib/documents";
import { createClient } from "@/lib/supabase/server";

type Result = { error: string };

async function authed() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  return supabase;
}
const done = () => revalidatePath("/", "layout");
type Client = Awaited<ReturnType<typeof authed>>;

/** Pulls the text out of a stored file so the assistant can read it. Failing to read never fails an upload. */
async function readInto(supabase: Client, id: string, path: string): Promise<{ chars: number; message: string }> {
  const ext = extensionOf(path);
  const file = await supabase.storage.from("documents").download(path);
  if (file.error || !file.data) return { chars: -1, message: "Could not open the file to read it." };
  const out = await extractText(new Uint8Array(await file.data.arrayBuffer()), ext);
  if (!out.ok) {
    if (out.reason === "empty") await supabase.from("documents").update({ text_content: null, text_chars: 0 }).eq("id", id);
    return { chars: out.reason === "empty" ? 0 : -1, message: out.message };
  }
  const { error } = await supabase.from("documents").update({ text_content: out.text, text_chars: out.text.length }).eq("id", id);
  if (error) return { chars: -1, message: `Read it, but could not save the text: ${error.message}` };
  return { chars: out.text.length, message: out.truncated ? "Read the first part of a very long file." : "" };
}

const validId = (id: unknown): id is string => typeof id === "string" && id.length > 0 && id.length <= 100;

/** Step 1: check the file is allowed and hand the browser a one-time token to upload it straight to storage. */
export async function prepareUpload(payload: unknown): Promise<{ ok: false; error: string } | { ok: true; path: string; token: string }> {
  const parsed = parseUploadRequest(payload);
  if (!parsed.ok) return { ok: false, error: parsed.error };
  const supabase = await authed();
  const path = `${randomUUID()}/${safeFileName(parsed.value.filename)}`;
  const { data, error } = await supabase.storage.from("documents").createSignedUploadUrl(path);
  if (error || !data) return { ok: false, error: `Could not start the upload: ${error?.message ?? "unknown problem"}` };
  return { ok: true, path, token: data.token };
}

/** Step 2: the file is uploaded; record it in the library. */
export async function finishUpload(path: unknown, payload: unknown): Promise<Result> {
  const parsed = parseUploadRequest(payload);
  if (!parsed.ok) return { error: parsed.error };
  if (typeof path !== "string" || !/^[0-9a-f-]{36}\/[A-Za-z0-9._-]+$/.test(path)) return { error: "That upload isn't valid." };
  const supabase = await authed();
  const v: UploadRequest = parsed.value;
  const ins = await supabase.from("documents").insert({
    name: v.name, category: v.category, path, mime: TYPES[extensionOf(v.filename)], size_bytes: v.size, game_id: v.gameId, practice_id: v.practiceId,
  }).select("id").single();
  if (ins.error) {
    await supabase.storage.from("documents").remove([path]); // don't leave an orphan file behind
    return { error: `Uploaded, but could not save it to the library: ${ins.error.message}` };
  }
  if (canRead(extensionOf(v.filename))) await readInto(supabase, ins.data.id, path);
  done();
  return { error: "" };
}

export async function updateDocument(id: string, payload: unknown): Promise<Result> {
  if (!validId(id) || typeof payload !== "object" || payload === null) return { error: "Unknown document." };
  const p = payload as Record<string, unknown>;
  const name = typeof p.name === "string" ? p.name.trim() : "";
  if (!name || name.length > 120) return { error: "Give it a name (max 120 characters)." };
  if (!CATEGORIES.some((c) => c.value === p.category)) return { error: "Pick a category." };
  const opt = (v: unknown) => (typeof v === "string" && v.trim() && v.length <= 100 ? v.trim() : null);
  const supabase = await authed();
  const { data, error } = await supabase.from("documents").update({ name, category: p.category, game_id: opt(p.gameId), practice_id: opt(p.practiceId) }).eq("id", id).select("id");
  if (error) return { error: `Could not save: ${error.message}` };
  if (!data || data.length === 0) return { error: "That document wasn't found." };
  done();
  return { error: "" };
}

export async function deleteDocument(id: string): Promise<Result> {
  if (!validId(id)) return { error: "Unknown document." };
  const supabase = await authed();
  const row = await supabase.from("documents").select("path").eq("id", id).maybeSingle();
  if (row.error) return { error: `Could not find it: ${row.error.message}` };
  if (!row.data) return { error: "That document was already removed." };
  const del = await supabase.from("documents").delete().eq("id", id);
  if (del.error) return { error: `Could not delete: ${del.error.message}` };
  await supabase.storage.from("documents").remove([row.data.path]);
  done();
  return { error: "" };
}

/** Reads (or re-reads) one document for the assistant. */
export async function readDocument(id: string): Promise<Result & { note?: string }> {
  if (!validId(id)) return { error: "Unknown document." };
  const supabase = await authed();
  const row = await supabase.from("documents").select("path").eq("id", id).maybeSingle();
  if (row.error || !row.data) return { error: "That document wasn't found." };
  if (!canRead(extensionOf(row.data.path))) return { error: "The assistant can read PDF, Word (.docx), text, Markdown and CSV files. Photos and Excel or PowerPoint files aren't supported yet." };
  const r = await readInto(supabase, id, row.data.path);
  done();
  if (r.chars < 0) return { error: r.message };
  return { error: "", note: r.chars === 0 ? r.message : r.message };
}
