"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { parseNoteInput } from "@/lib/notes";
import { createClient } from "@/lib/supabase/server";

type Result = { error: string };

async function authed() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  return supabase;
}
const done = () => revalidatePath("/", "layout");
const validId = (id: unknown): id is string => typeof id === "string" && id.length > 0 && id.length <= 100;

const columns = (v: NonNullable<ReturnType<typeof parseNoteInput> & { ok: true }>["value"]) => ({
  kind: v.kind, category: v.category, body: v.body, player_id: v.playerId, practice_id: v.practiceId, game_id: v.gameId, owner: v.owner, due_date: v.due,
});

export async function createNote(payload: unknown): Promise<Result> {
  const parsed = parseNoteInput(payload);
  if (!parsed.ok) return { error: parsed.error };
  const supabase = await authed();
  const { error } = await supabase.from("notes").insert(columns(parsed.value));
  if (error) return { error: `Could not save: ${error.message}` };
  done();
  return { error: "" };
}

export async function updateNote(id: string, payload: unknown): Promise<Result> {
  if (!validId(id)) return { error: "Unknown note." };
  const parsed = parseNoteInput(payload);
  if (!parsed.ok) return { error: parsed.error };
  const supabase = await authed();
  const { data, error } = await supabase.from("notes").update({ ...columns(parsed.value), updated_at: new Date().toISOString() }).eq("id", id).select("id");
  if (error) return { error: `Could not save: ${error.message}` };
  if (!data || data.length === 0) return { error: "That note wasn't found." };
  done();
  return { error: "" };
}

export async function setNoteDone(id: string, isDone: boolean): Promise<Result> {
  if (!validId(id) || typeof isDone !== "boolean") return { error: "Unknown note." };
  const supabase = await authed();
  const { data, error } = await supabase
    .from("notes")
    .update({ status: isDone ? "done" : "open", done_at: isDone ? new Date().toISOString() : null, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select("id");
  if (error) return { error: `Could not update: ${error.message}` };
  if (!data || data.length === 0) return { error: "That item wasn't found." };
  done();
  return { error: "" };
}

export async function deleteNote(id: string): Promise<Result> {
  if (!validId(id)) return { error: "Unknown note." };
  const supabase = await authed();
  const { error } = await supabase.from("notes").delete().eq("id", id);
  if (error) return { error: `Could not delete: ${error.message}` };
  done();
  return { error: "" };
}
