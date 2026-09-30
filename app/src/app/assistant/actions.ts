"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { aiStatus } from "@/lib/ai/config";
import { getCoaches, getDocuments, getGames, getNotes, getPlayers, getPractices } from "@/lib/db";
import { runAsk, runDraft, runTranscript, type Fail, type Ok } from "@/lib/ai/run";
import { draftToPractice, type DraftResult, type Proposal } from "@/lib/ai/schemas";
import type { AssistantData, Source } from "@/lib/ai/context";
import { parsePayload } from "@/lib/practice-edit";
import { parseNewPractice, practiceId } from "@/lib/new-practice";
import { createClient } from "@/lib/supabase/server";
import { nowInSchool } from "@/lib/week";

async function gate(): Promise<Fail | { ok: true; model: string; data: AssistantData }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const status = aiStatus();
  if (!status.ready) return { ok: false, error: "The assistant isn't switched on yet." };
  const [players, practices, games, notes, coaches, docs] = await Promise.all([getPlayers(), getPractices(), getGames(), getNotes(), getCoaches(), getDocuments()]);
  return { ok: true, model: status.model, data: { today: nowInSchool().today, players, practices, games, notes, coaches, docs } };
}

export async function askAssistant(question: string): Promise<Ok<{ answer: string; sources: Source[] }> | Fail> {
  if (typeof question !== "string") return { ok: false, error: "Type a question first." };
  const g = await gate();
  return !g.ok ? g : runAsk(g.model, g.data, question);
}

export async function draftPractice(input: { date: string; session: string; start: string; minutes: number; goals: string }): Promise<Ok<DraftResult> | Fail> {
  const parsed = parseNewPractice({ date: input?.date, session: input?.session });
  if (!parsed.ok) return { ok: false, error: parsed.error };
  const start = typeof input.start === "string" ? input.start.trim() : "";
  if (!/^(1[0-2]|[1-9]):[0-5]\d$/.test(start)) return { ok: false, error: "Start time should look like 6:55 or 12:55." };
  const g = await gate();
  if (!g.ok) return g;
  return runDraft(g.model, g.data, { date: parsed.value.date, session: parsed.value.session, start, minutes: Number(input.minutes) }, typeof input.goals === "string" ? input.goals : "");
}

export async function readTranscript(transcript: string): Promise<Ok<{ summary: string; proposals: Proposal[]; suggestions: string[] }> | Fail> {
  if (typeof transcript !== "string") return { ok: false, error: "Paste the transcript first." };
  const g = await gate();
  return !g.ok ? g : runTranscript(g.model, g.data, transcript);
}

/** Saves an approved draft as a real practice. The payload is checked again here; nothing from the model is trusted. */
export async function saveDraftPractice(input: { date: string; session: string; payload: unknown }): Promise<{ error: string; id?: string }> {
  const target = parseNewPractice({ date: input?.date, session: input?.session });
  if (!target.ok) return { error: target.error };
  const parsed = parsePayload(input.payload);
  if (!parsed.ok) return { error: parsed.error };
  const p = parsed.value;
  const { date, session } = target.value;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const id = practiceId(date, session);
  const exists = await supabase.from("practices").select("id").eq("id", id).maybeSingle();
  if (exists.error) return { error: `Could not check for an existing practice: ${exists.error.message}` };
  if (exists.data) return { error: `There is already a ${session} practice on that date. Pick another date or session.`, id };

  const ins = await supabase.from("practices").insert({ id, date, session, team: "Alma Jr. High Football", opponent: p.opponent || null, dress: p.dress || null, lift: p.lift || null, coaches: p.coaches, notes: p.notes, imported: false });
  if (ins.error) return { error: `Could not create the practice: ${ins.error.message}` };
  const draft = draftToPractice(p, { date, session });
  const rows = draft.blocks.map((b, i) => ({ practice_id: id, position: i, start_time: b.start, periods: b.periods, span: b.span ?? null, flex: b.flex === true, lanes: b.lanes ?? {} }));
  const blocks = await supabase.from("practice_blocks").insert(rows);
  if (blocks.error) {
    await supabase.from("practices").delete().eq("id", id);
    return { error: `Could not save the periods: ${blocks.error.message}` };
  }
  revalidatePath("/", "layout");
  return { error: "", id };
}
