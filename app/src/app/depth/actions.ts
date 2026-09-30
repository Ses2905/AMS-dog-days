"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { parsePosition, reorder } from "@/lib/depth";
import { createClient } from "@/lib/supabase/server";

type Result = { error: string };
const isUuid = (v: unknown): v is string => typeof v === "string" && /^[0-9a-f-]{36}$/i.test(v);
const isPlayer = (v: unknown): v is string => typeof v === "string" && v.length > 0 && v.length <= 100;
async function authed() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  return supabase;
}
const done = () => revalidatePath("/", "layout");

export async function addPlayerToPosition(positionId: string, playerId: string): Promise<Result> {
  if (!isUuid(positionId) || !isPlayer(playerId)) return { error: "Unknown position or player." };
  const supabase = await authed();
  const cur = await supabase.from("depth_slots").select("rank").eq("position_id", positionId).order("rank", { ascending: false }).limit(1);
  if (cur.error) return { error: `Could not read the chart: ${cur.error.message}` };
  const rank = cur.data.length ? cur.data[0].rank + 1 : 0;
  const { error } = await supabase.from("depth_slots").upsert({ position_id: positionId, player_id: playerId, rank }, { ignoreDuplicates: true, onConflict: "position_id,player_id" });
  if (error) return { error: `Could not add him: ${error.message}` };
  done();
  return { error: "" };
}

export async function removePlayerFromPosition(positionId: string, playerId: string): Promise<Result> {
  if (!isUuid(positionId) || !isPlayer(playerId)) return { error: "Unknown position or player." };
  const supabase = await authed();
  const { error } = await supabase.from("depth_slots").delete().eq("position_id", positionId).eq("player_id", playerId);
  if (error) return { error: `Could not remove him: ${error.message}` };
  done();
  return { error: "" };
}

export async function movePlayer(positionId: string, playerId: string, by: number): Promise<Result> {
  if (!isUuid(positionId) || !isPlayer(playerId) || (by !== -1 && by !== 1)) return { error: "Unknown position or player." };
  const supabase = await authed();
  const cur = await supabase.from("depth_slots").select("player_id,rank").eq("position_id", positionId).order("rank");
  if (cur.error) return { error: `Could not read the chart: ${cur.error.message}` };
  const ids = cur.data.map((r) => r.player_id);
  const next = reorder(ids, playerId, by);
  if (next.every((id, i) => id === ids[i])) return { error: "" };
  const { error } = await supabase.from("depth_slots").upsert(next.map((player_id, rank) => ({ position_id: positionId, player_id, rank })), { onConflict: "position_id,player_id" });
  if (error) return { error: `Could not reorder: ${error.message}` };
  done();
  return { error: "" };
}

export async function addPosition(payload: unknown): Promise<Result> {
  const parsed = parsePosition(payload);
  if (!parsed.ok) return { error: parsed.error };
  const supabase = await authed();
  const last = await supabase.from("depth_positions").select("sort").eq("unit", parsed.value.unit).order("sort", { ascending: false }).limit(1);
  const sort = last.data?.length ? last.data[0].sort + 1 : 0;
  const { error } = await supabase.from("depth_positions").insert({ ...parsed.value, sort });
  if (error) return { error: `Could not add the position: ${error.message}` };
  done();
  return { error: "" };
}

export async function updatePosition(id: string, payload: unknown): Promise<Result> {
  if (!isUuid(id)) return { error: "Unknown position." };
  const parsed = parsePosition(payload);
  if (!parsed.ok) return { error: parsed.error };
  const supabase = await authed();
  const { data, error } = await supabase.from("depth_positions").update({ name: parsed.value.name, starters: parsed.value.starters, unit: parsed.value.unit }).eq("id", id).select("id");
  if (error) return { error: `Could not save: ${error.message}` };
  if (!data || data.length === 0) return { error: "That position wasn't found." };
  done();
  return { error: "" };
}

export async function deletePosition(id: string): Promise<Result> {
  if (!isUuid(id)) return { error: "Unknown position." };
  const supabase = await authed();
  const { error } = await supabase.from("depth_positions").delete().eq("id", id);
  if (error) return { error: `Could not delete: ${error.message}` };
  done();
  return { error: "" };
}
