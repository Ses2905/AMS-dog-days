import { createClient } from "@supabase/supabase-js";
import { buildIcs, type Feed } from "@/lib/ics";

export const dynamic = "force-dynamic";

/** The subscribe link for Google Calendar and the iPhone Calendar app. It carries a secret in the address and no login. */
export async function GET(_req: Request, ctx: { params: Promise<{ token: string }> }) {
  const { token } = await ctx.params;
  const clean = token.replace(/\.ics$/i, "");
  if (!/^[a-f0-9]{64}$/.test(clean)) return new Response("Not found", { status: 404 });
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!, { auth: { persistSession: false } });
  const { data, error } = await supabase.rpc("calendar_feed", { p_token: clean });
  if (error) return new Response("The calendar is unavailable right now.", { status: 503 });
  if (!data) return new Response("Not found", { status: 404 });
  return new Response(buildIcs(data as Feed), {
    headers: { "Content-Type": "text/calendar; charset=utf-8", "Cache-Control": "private, max-age=300", "Content-Disposition": 'inline; filename="coach-os.ics"' },
  });
}
