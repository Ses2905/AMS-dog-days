"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { parseLinks } from "@/lib/games";
import { createClient } from "@/lib/supabase/server";

export async function saveToolLinks(links: unknown): Promise<{ error: string }> {
  const parsed = parseLinks(links);
  if (!parsed.ok) return { error: parsed.error };
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { error } = await supabase.from("settings").upsert({ key: "tool_links", value: parsed.value, updated_at: new Date().toISOString() });
  if (error) return { error: `Could not save the tools: ${error.message}` };
  revalidatePath("/", "layout");
  return { error: "" };
}
