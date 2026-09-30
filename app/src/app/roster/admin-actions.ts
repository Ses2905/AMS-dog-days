"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { parseCoachInput, parsePlayerInput, uniqueId } from "@/lib/roster-admin";

type Result = { error: string };

async function authed() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  return supabase;
}
const done = () => revalidatePath("/", "layout");

export async function createPlayer(payload: unknown): Promise<Result> {
  const parsed = parsePlayerInput(payload);
  if (!parsed.ok) return { error: parsed.error };
  const { first, last, grade, number } = parsed.value;
  const supabase = await authed();
  const ids = await supabase.from("players").select("id");
  if (ids.error) return { error: `Could not check existing players: ${ids.error.message}` };
  const id = uniqueId(`${first} ${last}`, ids.data.map((r) => r.id));
  const ins = await supabase.from("players").insert({ id, first_name: first, last_name: last, grade, number, other_numbers: [] });
  if (ins.error) return { error: `Could not add the player: ${ins.error.message}` };
  done();
  return { error: "" };
}

export async function updatePlayer(id: string, payload: unknown): Promise<Result> {
  if (typeof id !== "string" || !id || id.length > 100) return { error: "Unknown player." };
  const parsed = parsePlayerInput(payload);
  if (!parsed.ok) return { error: parsed.error };
  const { first, last, grade, number, confirmNumber } = parsed.value;
  const supabase = await authed();
  const patch: Record<string, unknown> = { first_name: first, last_name: last, grade, number };
  if (confirmNumber) patch.other_numbers = []; // he has settled which number is right
  const upd = await supabase.from("players").update(patch).eq("id", id).select("id");
  if (upd.error) return { error: `Could not save: ${upd.error.message}` };
  if (!upd.data || upd.data.length === 0) return { error: "That player wasn't found." };
  done();
  redirect("/roster");
}

export async function deletePlayer(id: string): Promise<Result> {
  if (typeof id !== "string" || !id || id.length > 100) return { error: "Unknown player." };
  const supabase = await authed();
  const del = await supabase.from("players").delete().eq("id", id);
  if (del.error) return { error: `Could not remove the player: ${del.error.message}` };
  done();
  redirect("/roster");
}

/** Two entries are the same kid: keep one, fold the other's number into "also #", remove the extra. */
export async function mergePlayers(keepId: string, removeId: string): Promise<Result> {
  if (typeof keepId !== "string" || typeof removeId !== "string" || !keepId || !removeId || keepId === removeId) return { error: "Pick two different players." };
  const supabase = await authed();
  const res = await supabase.from("players").select("id, number, other_numbers").in("id", [keepId, removeId]);
  if (res.error) return { error: `Could not read the players: ${res.error.message}` };
  const keep = res.data.find((p) => p.id === keepId);
  const remove = res.data.find((p) => p.id === removeId);
  if (!keep || !remove) return { error: "One of those players no longer exists." };
  const others = [...new Set([...keep.other_numbers, ...remove.other_numbers, remove.number])].filter((n) => n !== keep.number);
  const upd = await supabase.from("players").update({ other_numbers: others }).eq("id", keepId);
  if (upd.error) return { error: `Could not merge: ${upd.error.message}` };
  const del = await supabase.from("players").delete().eq("id", removeId);
  if (del.error) return { error: `Merged the numbers but could not remove the duplicate: ${del.error.message}` };
  done();
  redirect("/roster");
}

export async function saveCoach(id: string | null, payload: unknown): Promise<Result> {
  const parsed = parseCoachInput(payload);
  if (!parsed.ok) return { error: parsed.error };
  const { first, last, role, active } = parsed.value;
  const supabase = await authed();
  if (id) {
    const upd = await supabase.from("coaches").update({ first_name: first, last_name: last, role, active }).eq("id", id).select("id");
    if (upd.error) return { error: `Could not save: ${upd.error.message}` };
    if (!upd.data || upd.data.length === 0) return { error: "That coach wasn't found." };
  } else {
    const ids = await supabase.from("coaches").select("id, sort");
    if (ids.error) return { error: `Could not check existing coaches: ${ids.error.message}` };
    const newId = uniqueId(last, ids.data.map((r) => r.id));
    const sort = Math.max(0, ...ids.data.map((r) => r.sort)) + 1;
    const ins = await supabase.from("coaches").insert({ id: newId, first_name: first, last_name: last, role, active, sort });
    if (ins.error) return { error: `Could not add the coach: ${ins.error.message}` };
  }
  done();
  return { error: "" };
}

export async function deleteCoach(id: string): Promise<Result> {
  if (typeof id !== "string" || !id || id.length > 100) return { error: "Unknown coach." };
  const supabase = await authed();
  const del = await supabase.from("coaches").delete().eq("id", id);
  if (del.error) return { error: `Could not remove the coach: ${del.error.message}` };
  done();
  return { error: "" };
}
