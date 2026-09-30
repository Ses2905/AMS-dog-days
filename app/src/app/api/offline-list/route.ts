import { getGames, getPractices, getScripts } from "@/lib/db";
import { offlineUrls } from "@/lib/offline";
import { createClient } from "@/lib/supabase/server";
import { nowInSchool } from "@/lib/week";

export const dynamic = "force-dynamic";

/** Which pages the phone should keep a copy of. Signed-in only. */
export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return new Response("Sign in first.", { status: 401 });
  const [practices, games, scripts] = await Promise.all([getPractices(), getGames(), getScripts()]);
  return Response.json({ urls: offlineUrls(nowInSchool().today, practices, games, scripts) }, { headers: { "Cache-Control": "no-store" } });
}
