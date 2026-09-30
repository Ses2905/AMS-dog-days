"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { parsePayload, startTimes } from "@/lib/practice-edit";

export async function savePractice(id: string, payload: unknown): Promise<{ error: string }> {
  if (typeof id !== "string" || id.length === 0 || id.length > 100) return { error: "Unknown practice." };
  const parsed = parsePayload(payload);
  if (!parsed.ok) return { error: parsed.error };
  const p = parsed.value;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const starts = startTimes(p.start, p.blocks);
  const rows = p.blocks.map((b, i) => ({
    practice_id: id,
    position: i,
    start_time: starts[i],
    periods: b.periods,
    span: b.span ?? null,
    flex: b.flex === true,
    lanes: b.lanes ?? {},
  }));

  // Blocks first, then the practice row, so a failure never leaves a "reviewed" practice with old periods.
  const up = await supabase.from("practice_blocks").upsert(rows, { onConflict: "practice_id,position" });
  if (up.error) return { error: `Could not save the periods: ${up.error.message}` };
  const del = await supabase.from("practice_blocks").delete().eq("practice_id", id).gte("position", rows.length);
  if (del.error) return { error: `Could not remove old periods: ${del.error.message}` };

  const upd = await supabase
    .from("practices")
    .update({
      dress: p.dress || null,
      lift: p.lift || null,
      opponent: p.opponent || null,
      od_meeting: p.odMeeting || null,
      situations: p.situations || null,
      coaches: p.coaches,
      notes: p.notes,
      imported: false, // he has looked at it and saved it
    })
    .eq("id", id);
  if (upd.error) return { error: `Could not save the details: ${upd.error.message}` };

  revalidatePath("/", "layout");
  redirect(`/practice/${id}`);
}
