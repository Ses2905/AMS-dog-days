"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { DEFAULT_START, parseNewPractice, practiceId } from "@/lib/new-practice";
import { addMinutes } from "@/lib/time";

type SourceBlock = { position: number; start_time: string; periods: number; span: string | null; flex: boolean; lanes: unknown };
type Source = { dress: string | null; lift: string | null; opponent: string | null; coaches: string[]; team: string; practice_blocks: SourceBlock[] };

const back = (msg: string, existing?: string): never =>
  redirect(`/practice/new?error=${encodeURIComponent(msg)}${existing ? `&existing=${encodeURIComponent(existing)}` : ""}`);

export async function createPractice(formData: FormData): Promise<void> {
  const parsed = parseNewPractice({
    date: formData.get("date"), session: formData.get("session"), custom: formData.get("custom"), from: formData.get("from"),
  });
  if (!parsed.ok) return back(parsed.error);
  const { date, session, from } = parsed.value;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const id = practiceId(date, session);
  const exists = await supabase.from("practices").select("id").eq("id", id).maybeSingle();
  if (exists.error) return back(`Could not check for an existing practice: ${exists.error.message}`);
  if (exists.data) return back(`There is already a ${session} practice on that date.`, id);

  let source: Source | null = null;
  if (from) {
    const res = await supabase.from("practices").select("dress,lift,opponent,coaches,team,practice_blocks(position,start_time,periods,span,flex,lanes)").eq("id", from).maybeSingle();
    if (res.error) return back(`Could not read the practice to copy: ${res.error.message}`);
    if (!res.data) return back("The practice you picked to copy no longer exists.");
    source = res.data as Source;
  } else {
    // Blank practice: reuse the coach columns from the latest practice so he doesn't retype them.
    const latest = await supabase.from("practices").select("coaches,team").order("date", { ascending: false }).limit(1).maybeSingle();
    source = latest.data ? { dress: null, lift: null, opponent: null, coaches: latest.data.coaches, team: latest.data.team, practice_blocks: [] } : null;
  }

  const ins = await supabase.from("practices").insert({
    id, date, session,
    team: source?.team ?? "Alma Jr. High Football",
    opponent: source?.opponent ?? null,
    dress: source?.dress ?? null,
    lift: source?.lift ?? null,
    coaches: source?.coaches ?? [],
    notes: [],
    imported: false,
  });
  if (ins.error) return back(`Could not create the practice: ${ins.error.message}`);

  const copied = source?.practice_blocks ?? [];
  const start = DEFAULT_START[session] ?? "3:45";
  const rows = copied.length > 0
    ? copied.map((b) => ({ practice_id: id, position: b.position, start_time: b.start_time, periods: b.periods, span: b.span, flex: b.flex, lanes: b.lanes }))
    : [
        { practice_id: id, position: 0, start_time: start, periods: 1, span: "Warm-Up", flex: true, lanes: {} },
        { practice_id: id, position: 1, start_time: addMinutes(start, 5), periods: 1, span: "End of Practice", flex: false, lanes: {} },
      ];
  const blocks = await supabase.from("practice_blocks").insert(rows);
  if (blocks.error) {
    await supabase.from("practices").delete().eq("id", id); // don't leave an empty practice behind
    return back(`Could not copy the periods: ${blocks.error.message}`);
  }

  revalidatePath("/", "layout");
  redirect(`/practice/${id}/edit`);
}
