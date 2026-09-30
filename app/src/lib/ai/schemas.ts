import { z } from "zod";
import { parsePayload, type EditPayload } from "../practice-edit";
import { parseNoteInput, type NoteInput } from "../notes";
import type { Coach } from "../db-types";
import type { Player, Practice } from "../types";
import { practiceId } from "../new-practice";

/** What the model is asked to return for a practice draft. Lanes are a list so the model can't invent keys. */
export const draftSchema = z.object({
  dress: z.string(),
  lift: z.string(),
  opponent: z.string(),
  notes: z.array(z.string()),
  blocks: z.array(z.object({
    periods: z.number().int(),
    /** Full-width text such as "Stretch and Warm-Up" or "Break"; leave empty when coaches have separate assignments. */
    span: z.string(),
    lanes: z.array(z.object({ coach: z.string(), text: z.string() })),
  })),
  reasoning: z.string(),
});
export type Draft = z.infer<typeof draftSchema>;

export const transcriptSchema = z.object({
  summary: z.string(),
  items: z.array(z.object({
    kind: z.enum(["note", "action"]),
    body: z.string(),
    /** Jersey number when the item is about one player, else null. */
    playerNumber: z.number().int().nullable(),
    /** A coach's last name when someone was given the task, else null. */
    owner: z.string().nullable(),
    /** YYYY-MM-DD only when a date was actually said, else null. */
    due: z.string().nullable(),
  })),
  /** Things that would change a practice or the depth chart. Shown as text only; the coach makes those edits himself. */
  suggestions: z.array(z.string()),
});
export type TranscriptOut = z.infer<typeof transcriptSchema>;

export type DraftRequest = { date: string; session: string; start: string; minutes: number };

export type DraftResult = { payload: EditPayload; warnings: string[]; reasoning: string; practice: Practice };

/** Checks a draft the way a hand-typed practice is checked, and drops anything the coach can't act on. */
export function checkDraft(d: Draft, req: DraftRequest, coaches: Pick<Coach, "last">[]): { ok: true; value: DraftResult } | { ok: false; error: string } {
  const warnings: string[] = [];
  const known = new Map(coaches.map((c) => [c.last.toLowerCase(), c.last]));
  const used: string[] = [];
  const blocks = d.blocks.map((b) => {
    const lanes: Record<string, string> = {};
    for (const l of b.lanes) {
      const name = known.get(l.coach.trim().toLowerCase());
      if (!name) { if (l.text.trim()) warnings.push(`Dropped an assignment for "${l.coach}" (not on the coaching staff).`); continue; }
      if (l.text.trim()) { lanes[name] = l.text.trim(); if (!used.includes(name)) used.push(name); }
    }
    const span = b.span.trim();
    return span ? { periods: b.periods, span, flex: false } : { periods: b.periods, lanes, flex: false };
  }).filter((b) => "span" in b || Object.keys(b.lanes ?? {}).length > 0);

  const total = blocks.reduce((n, b) => n + b.periods * 5, 0);
  if (total !== req.minutes) warnings.push(`The plan runs ${total} minutes; you asked for ${req.minutes}. Adjust before you use it.`);

  const parsed = parsePayload({ start: req.start, dress: d.dress, lift: d.lift, opponent: d.opponent, odMeeting: "", situations: "", coaches: used, notes: d.notes, blocks });
  if (!parsed.ok) return { ok: false, error: `The draft wasn't usable: ${parsed.error} Try again.` };
  return { ok: true, value: { payload: parsed.value, warnings, reasoning: d.reasoning.trim(), practice: draftToPractice(parsed.value, req) } };
}

export function draftToPractice(p: EditPayload, req: Pick<DraftRequest, "date" | "session">): Practice {
  let elapsed = 0;
  const [h, m] = p.start.split(":").map(Number);
  const blocks = p.blocks.map((b) => {
    const mins = (h % 12) * 60 + m + elapsed;
    elapsed += b.periods * 5;
    const hh = Math.floor(mins / 60) % 12 || 12;
    return { start: `${hh}:${String(mins % 60).padStart(2, "0")}`, periods: b.periods, flex: b.flex, span: b.span, lanes: b.lanes };
  });
  return { id: practiceId(req.date, req.session), date: req.date, session: req.session, team: "Alma Jr. High Football", opponent: p.opponent || undefined, dress: p.dress, lift: p.lift || undefined, coaches: p.coaches, blocks, notes: p.notes };
}

export type Proposal = { key: string; label: string; note: NoteInput };

/** Turns what the model found into notes the coach can add with one tap. Nothing is saved here. */
export function checkTranscript(t: TranscriptOut, players: Pick<Player, "id" | "number" | "last">[], coaches: Pick<Coach, "id" | "last" | "active">[]): { summary: string; proposals: Proposal[]; suggestions: string[] } {
  const proposals: Proposal[] = [];
  t.items.slice(0, 40).forEach((it, i) => {
    const matches = it.playerNumber == null ? [] : players.filter((p) => p.number === it.playerNumber);
    const owner = it.owner ? coaches.find((c) => c.active && c.last.toLowerCase() === it.owner!.trim().toLowerCase()) : undefined;
    const r = parseNoteInput({ kind: it.kind, body: it.body, playerId: matches.length === 1 ? matches[0].id : null, owner: owner?.id ?? null, due: it.due ?? "" });
    if (r.ok) proposals.push({ key: `p${i}`, label: matches.length === 1 ? `#${matches[0].number} ${matches[0].last}` : "", note: r.value });
  });
  return { summary: t.summary.trim(), proposals, suggestions: t.suggestions.map((s) => s.trim()).filter(Boolean).slice(0, 10) };
}
