"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { parseName, parseRows, type ScriptRow } from "@/lib/scripts";
import { createClient } from "@/lib/supabase/server";

type Result = { error: string };
const isUuid = (v: unknown): v is string => typeof v === "string" && /^[0-9a-f-]{36}$/i.test(v);
const optId = (v: unknown) => (typeof v === "string" && v.length > 0 && v.length <= 120 ? v : null);
async function authed() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  return supabase;
}
const done = () => revalidatePath("/", "layout");

const rowColumns = (scriptId: string, rows: ScriptRow[]) => rows.map((r, position) => ({
  script_id: scriptId, position, section: r.section, down: r.down, distance: r.distance, hash: r.hash, personnel: r.personnel,
  formation: r.formation, motion: r.motion, play: r.play, defense: r.defense, notes: r.notes, ran: r.ran,
}));

/** Starts a script, optionally copying the plays from an earlier one (marked not run). */
export async function createScript(input: { name: unknown; practiceId?: unknown; gameId?: unknown; copyFrom?: unknown }): Promise<Result & { id?: string }> {
  const name = parseName(input?.name);
  if (!name.ok) return { error: name.error };
  const supabase = await authed();
  let rows: ScriptRow[] = [];
  if (input.copyFrom) {
    if (!isUuid(input.copyFrom)) return { error: "Unknown script to copy." };
    const src = await supabase.from("script_rows").select("*").eq("script_id", input.copyFrom).order("position");
    if (src.error) return { error: `Could not read the script to copy: ${src.error.message}` };
    rows = src.data.map((r) => ({ section: r.section, down: r.down, distance: r.distance, hash: r.hash, personnel: r.personnel, formation: r.formation, motion: r.motion, play: r.play, defense: r.defense, notes: r.notes, ran: false }));
  }
  const ins = await supabase.from("scripts").insert({ name: name.value, practice_id: optId(input.practiceId), game_id: optId(input.gameId) }).select("id").single();
  if (ins.error) return { error: `Could not create the script: ${ins.error.message}` };
  if (rows.length > 0) {
    const r = await supabase.from("script_rows").insert(rowColumns(ins.data.id, rows));
    if (r.error) { await supabase.from("scripts").delete().eq("id", ins.data.id); return { error: `Could not copy the plays: ${r.error.message}` }; }
  }
  done();
  return { error: "", id: ins.data.id };
}

export async function saveScript(id: string, payload: { name: unknown; rows: unknown; practiceId?: unknown; gameId?: unknown }): Promise<Result> {
  if (!isUuid(id)) return { error: "Unknown script." };
  const name = parseName(payload?.name);
  if (!name.ok) return { error: name.error };
  const rows = parseRows(payload.rows);
  if (!rows.ok) return { error: rows.error };
  const supabase = await authed();
  // Rows first, then the header, so a failure never leaves a renamed script with old plays.
  if (rows.value.length > 0) {
    const up = await supabase.from("script_rows").upsert(rowColumns(id, rows.value), { onConflict: "script_id,position" });
    if (up.error) return { error: `Could not save the plays: ${up.error.message}` };
  }
  const del = await supabase.from("script_rows").delete().eq("script_id", id).gte("position", rows.value.length);
  if (del.error) return { error: `Could not remove old plays: ${del.error.message}` };
  const upd = await supabase.from("scripts").update({ name: name.value, practice_id: optId(payload.practiceId), game_id: optId(payload.gameId), updated_at: new Date().toISOString() }).eq("id", id).select("id");
  if (upd.error) return { error: `Could not save the script: ${upd.error.message}` };
  if (!upd.data || upd.data.length === 0) return { error: "That script wasn't found." };
  done();
  return { error: "" };
}

export async function deleteScript(id: string): Promise<Result> {
  if (!isUuid(id)) return { error: "Unknown script." };
  const supabase = await authed();
  const { error } = await supabase.from("scripts").delete().eq("id", id);
  if (error) return { error: `Could not delete: ${error.message}` };
  done();
  return { error: "" };
}

/** Sideline mode: tap a play to mark it run. */
export async function setRowRan(id: string, position: number, ran: boolean): Promise<Result> {
  if (!isUuid(id) || !Number.isInteger(position) || position < 0 || typeof ran !== "boolean") return { error: "Unknown play." };
  const supabase = await authed();
  const { data, error } = await supabase.from("script_rows").update({ ran }).eq("script_id", id).eq("position", position).select("position");
  if (error) return { error: `Could not save: ${error.message}` };
  if (!data || data.length === 0) return { error: "That play wasn't found." };
  done();
  return { error: "" };
}
