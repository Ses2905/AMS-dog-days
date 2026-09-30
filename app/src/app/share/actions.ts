"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { parseLinks } from "@/lib/games";
import { createClient } from "@/lib/supabase/server";

/** Save a link shared from another app: onto a game's Film & links, or (no game) as a note. */
export async function saveSharedLink(payload: unknown): Promise<{ error: string; gameId?: string }> {
  const p = (typeof payload === "object" && payload !== null ? payload : {}) as Record<string, unknown>;
  const parsed = parseLinks([{ label: p.label, url: p.url }]);
  if (!parsed.ok) return { error: parsed.error };
  const link = parsed.value[0];
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const gameId = typeof p.gameId === "string" && p.gameId.length <= 120 ? p.gameId : "";
  if (gameId) {
    const cur = await supabase.from("games").select("links").eq("id", gameId).maybeSingle();
    if (cur.error) return { error: `Could not read the game: ${cur.error.message}` };
    if (!cur.data) return { error: "That game wasn't found." };
    const merged = parseLinks([...((cur.data.links as unknown[]) ?? []), link]);
    if (!merged.ok) return { error: merged.error };
    const upd = await supabase.from("games").update({ links: merged.value }).eq("id", gameId);
    if (upd.error) return { error: `Could not save: ${upd.error.message}` };
    revalidatePath("/", "layout");
    return { error: "", gameId };
  }
  const ins = await supabase.from("notes").insert({ kind: "note", body: `${link.label}\n${link.url}`.slice(0, 2000) });
  if (ins.error) return { error: `Could not save: ${ins.error.message}` };
  revalidatePath("/", "layout");
  return { error: "" };
}
