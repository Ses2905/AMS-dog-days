"use server";

import { randomBytes } from "node:crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

/** Replaces the secret in the calendar link. Anyone with the old link stops getting updates. */
export async function resetCalendarLink(): Promise<{ error: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { error } = await supabase.from("settings").upsert({ key: "calendar_token", value: randomBytes(32).toString("hex"), updated_at: new Date().toISOString() });
  if (error) return { error: `Could not reset the link: ${error.message}` };
  revalidatePath("/settings");
  return { error: "" };
}
