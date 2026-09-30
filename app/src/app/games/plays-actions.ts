"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { parsePlayInput, totals } from "@/lib/plays";
import { createClient } from "@/lib/supabase/server";

type Result = { error: string };
const validId = (id: unknown): id is string => typeof id === "string" && id.length > 0 && id.length <= 120;
async function authed() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  return supabase;
}
const done = () => revalidatePath("/", "layout");

export async function addPlay(gameId: string, payload: unknown): Promise<Result> {
  if (!validId(gameId)) return { error: "Unknown game." };
  const supabase = await authed();
  const players = await supabase.from("players").select("id");
  if (players.error) return { error: `Could not check the roster: ${players.error.message}` };
  const parsed = parsePlayInput(payload, new Set(players.data.map((p) => p.id)));
  if (!parsed.ok) return { error: parsed.error };
  const v = parsed.value;
  const { error } = await supabase.from("game_plays").insert({ game_id: gameId, quarter: v.quarter, team: v.team, type: v.type, points: v.points, player_id: v.playerId, scorer_name: v.scorerName, detail: v.detail });
  if (error) return { error: `Could not save the score: ${error.message}` };
  done();
  return { error: "" };
}

export async function deletePlay(id: string): Promise<Result> {
  if (!validId(id)) return { error: "Unknown play." };
  const supabase = await authed();
  const { error } = await supabase.from("game_plays").delete().eq("id", id);
  if (error) return { error: `Could not delete: ${error.message}` };
  done();
  return { error: "" };
}

/** Copies the scoring log's totals onto the game and marks it final. */
export async function setFinalFromLog(gameId: string): Promise<Result> {
  if (!validId(gameId)) return { error: "Unknown game." };
  const supabase = await authed();
  const plays = await supabase.from("game_plays").select("team,points").eq("game_id", gameId);
  if (plays.error) return { error: `Could not read the scoring log: ${plays.error.message}` };
  if (plays.data.length === 0) return { error: "Log a score first." };
  const t = totals(plays.data as { team: "us" | "them"; points: number }[]);
  const { data, error } = await supabase.from("games").update({ score_us: t.us, score_them: t.them, status: "final" }).eq("id", gameId).select("id");
  if (error) return { error: `Could not save the final score: ${error.message}` };
  if (!data || data.length === 0) return { error: "That game wasn't found." };
  done();
  return { error: "" };
}
