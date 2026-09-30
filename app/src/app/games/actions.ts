"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { gameId, isChecklistKey, parseGameInput, parseLinks } from "@/lib/games";
import { createClient } from "@/lib/supabase/server";

type Result = { error: string };

async function authed() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  return supabase;
}
const done = () => revalidatePath("/", "layout");
const validId = (id: unknown): id is string => typeof id === "string" && id.length > 0 && id.length <= 120;

const columns = (v: NonNullable<ReturnType<typeof parseGameInput> & { ok: true }>["value"]) => ({
  date: v.date, start_time: v.time, level: v.level, opponent: v.opponent, site: v.site, location: v.location, kind: v.kind, status: v.status,
  score_us: v.scoreUs, score_them: v.scoreThem,
});

export async function createGame(payload: unknown): Promise<Result> {
  const parsed = parseGameInput(payload);
  if (!parsed.ok) return { error: parsed.error };
  const supabase = await authed();
  const ids = await supabase.from("games").select("id");
  if (ids.error) return { error: `Could not check existing games: ${ids.error.message}` };
  const id = gameId(parsed.value.date, parsed.value.opponent, ids.data.map((r) => r.id));
  const ins = await supabase.from("games").insert({ id, ...columns(parsed.value) });
  if (ins.error) return { error: `Could not save the game: ${ins.error.message}` };
  done();
  return { error: "" };
}

export async function updateGame(id: string, payload: unknown): Promise<Result> {
  if (!validId(id)) return { error: "Unknown game." };
  const parsed = parseGameInput(payload);
  if (!parsed.ok) return { error: parsed.error };
  const supabase = await authed();
  const { data, error } = await supabase.from("games").update(columns(parsed.value)).eq("id", id).select("id");
  if (error) return { error: `Could not save: ${error.message}` };
  if (!data || data.length === 0) return { error: "That game wasn't found." };
  done();
  return { error: "" };
}

export async function deleteGame(id: string): Promise<Result> {
  if (!validId(id)) return { error: "Unknown game." };
  const supabase = await authed();
  const { error } = await supabase.from("games").delete().eq("id", id); // notes about it stay, just unlinked
  if (error) return { error: `Could not delete: ${error.message}` };
  done();
  redirect("/games");
}

export async function setChecklistItem(id: string, key: string, value: boolean): Promise<Result> {
  if (!validId(id) || !isChecklistKey(key) || typeof value !== "boolean") return { error: "Unknown checklist item." };
  const supabase = await authed();
  const cur = await supabase.from("games").select("checklist").eq("id", id).maybeSingle();
  if (cur.error) return { error: `Could not read the checklist: ${cur.error.message}` };
  if (!cur.data) return { error: "That game wasn't found." };
  const next = { ...(cur.data.checklist as Record<string, boolean>), [key]: value };
  const upd = await supabase.from("games").update({ checklist: next }).eq("id", id);
  if (upd.error) return { error: `Could not save: ${upd.error.message}` };
  done();
  return { error: "" };
}

export async function saveLinks(id: string, links: unknown): Promise<Result> {
  if (!validId(id)) return { error: "Unknown game." };
  const parsed = parseLinks(links);
  if (!parsed.ok) return { error: parsed.error };
  const supabase = await authed();
  const { data, error } = await supabase.from("games").update({ links: parsed.value }).eq("id", id).select("id");
  if (error) return { error: `Could not save the links: ${error.message}` };
  if (!data || data.length === 0) return { error: "That game wasn't found." };
  done();
  return { error: "" };
}

/** The links to the Hudl and school athletics schedule pages, shown at the top of the Games tab. */
export async function saveScheduleLinks(links: unknown): Promise<Result> {
  const parsed = parseLinks(links);
  if (!parsed.ok) return { error: parsed.error };
  const supabase = await authed();
  const { error } = await supabase.from("settings").upsert({ key: "schedule_links", value: parsed.value, updated_at: new Date().toISOString() });
  if (error) return { error: `Could not save the links: ${error.message}` };
  done();
  return { error: "" };
}
