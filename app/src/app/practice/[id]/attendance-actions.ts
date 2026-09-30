"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { bulkPresentTargets, isMark, type Mark } from "@/lib/attendance";
import { getPlayers } from "@/lib/db";
import { createClient } from "@/lib/supabase/server";

const validId = (v: unknown): v is string => typeof v === "string" && v.length > 0 && v.length <= 100;
async function authed() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  return supabase;
}

/** mark = null clears the entry (back to "not marked"). */
export async function setAttendance(practiceId: string, playerId: string, mark: Mark | null): Promise<{ error: string }> {
  if (!validId(practiceId) || !validId(playerId) || (mark !== null && !isMark(mark))) return { error: "Unknown practice or player." };
  const supabase = await authed();
  const res = mark === null
    ? await supabase.from("attendance").delete().eq("practice_id", practiceId).eq("player_id", playerId)
    : await supabase.from("attendance").upsert({ practice_id: practiceId, player_id: playerId, status: mark, updated_at: new Date().toISOString() });
  if (res.error) return { error: `Could not save: ${res.error.message}` };
  revalidatePath("/", "layout");
  return { error: "" };
}

export async function markEveryonePresent(practiceId: string): Promise<{ error: string; count: number }> {
  if (!validId(practiceId)) return { error: "Unknown practice.", count: 0 };
  const supabase = await authed();
  const practice = await supabase.from("practices").select("date").eq("id", practiceId).maybeSingle();
  if (practice.error || !practice.data) return { error: "That practice wasn't found.", count: 0 };
  const [players, existing] = await Promise.all([getPlayers(), supabase.from("attendance").select("player_id").eq("practice_id", practiceId)]);
  if (existing.error) return { error: `Could not read attendance: ${existing.error.message}`, count: 0 };
  const ids = bulkPresentTargets(players, new Set(existing.data.map((r) => r.player_id)), practice.data.date);
  if (ids.length === 0) return { error: "", count: 0 };
  const { error } = await supabase.from("attendance").upsert(ids.map((player_id) => ({ practice_id: practiceId, player_id, status: "present" })));
  if (error) return { error: `Could not save: ${error.message}`, count: 0 };
  revalidatePath("/", "layout");
  return { error: "", count: ids.length };
}
