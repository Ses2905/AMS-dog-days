import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const TABLES = ["players", "coaches", "practices", "practice_blocks", "attendance", "games", "game_plays", "notes", "scripts", "script_rows", "depth_positions", "depth_slots", "documents", "saved_outputs", "settings"] as const;

/** Everything in the app as one JSON file, so nothing is trapped here. Signed-in only. Uploaded files are listed, not included. */
export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return new Response("Sign in first.", { status: 401 });
  const out: Record<string, unknown> = { exportedAt: new Date().toISOString(), note: "Uploaded documents are listed in the documents table; download the files from the Library." };
  for (const t of TABLES) {
    const { data, error } = await supabase.from(t).select("*");
    if (error) return new Response(`Could not read ${t}: ${error.message}`, { status: 500 });
    // The calendar link's secret is not part of an export people might email around.
    out[t] = t === "settings" ? data.filter((r) => r.key !== "calendar_token") : data;
  }
  const day = new Date().toISOString().slice(0, 10);
  return new Response(JSON.stringify(out, null, 2), { headers: { "Content-Type": "application/json", "Content-Disposition": `attachment; filename="coach-os-export-${day}.json"`, "Cache-Control": "no-store" } });
}
