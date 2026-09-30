"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { parseStatusUpdate } from "@/lib/availability";
import { createClient } from "@/lib/supabase/server";

export async function setPlayerStatus(payload: unknown): Promise<{ error: string }> {
  const parsed = parseStatusUpdate(payload);
  if (!parsed.ok) return { error: parsed.error };
  const { playerId, status, note, until } = parsed.value;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data, error } = await supabase
    .from("players")
    .update({ status, status_note: note, status_until: until })
    .eq("id", playerId)
    .select("id");
  if (error) return { error: `Could not save: ${error.message}` };
  if (!data || data.length === 0) return { error: "That player wasn't found." };

  revalidatePath("/", "layout");
  return { error: "" };
}
