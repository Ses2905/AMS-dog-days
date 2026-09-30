import type { Note, NoteCategory } from "./db-types";

/** What a coach wants to keep on a player. Parent notes are private: they are never shown to the assistant. */
export const NOTE_CATEGORIES: { value: NoteCategory; label: string; hint: string }[] = [
  { value: "performance", label: "Performance", hint: "How he is playing, what you saw" },
  { value: "position", label: "Position Ideas", hint: "Where he could play down the road" },
  { value: "challenge", label: "Challenges", hint: "What is holding him back" },
  { value: "opportunity", label: "Areas of Opportunity", hint: "What to work on next" },
  { value: "parent", label: "Parent Contact", hint: "Calls, emails, concerns. Private." },
];
export const categoryLabel = (c: NoteCategory | null) => NOTE_CATEGORIES.find((x) => x.value === c)?.label ?? "";

export type NoteInput = { kind: "note" | "action"; category: NoteCategory | null; body: string; playerId: string | null; practiceId: string | null; gameId: string | null; owner: string | null; due: string | null };

const validDate = (s: string) => {
  const d = new Date(`${s}T00:00:00Z`);
  return /^\d{4}-\d{2}-\d{2}$/.test(s) && !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === s;
};
const optId = (v: unknown, label: string) => {
  if (v == null || v === "") return null;
  if (typeof v !== "string" || v.length > 100) throw new Error(`${label} isn't valid.`);
  return v;
};

export function parseNoteInput(input: unknown): { ok: true; value: NoteInput } | { ok: false; error: string } {
  try {
    if (typeof input !== "object" || input === null) throw new Error("Nothing to save.");
    const p = input as Record<string, unknown>;
    if (p.kind !== "note" && p.kind !== "action") throw new Error("Pick Note or Action item.");
    const body = typeof p.body === "string" ? p.body.trim() : "";
    if (!body) throw new Error(p.kind === "action" ? "Write what needs to happen." : "Write the note first.");
    if (body.length > 2000) throw new Error("That's too long (max 2,000 characters). Split it into two notes.");
    const due = typeof p.due === "string" ? p.due.trim() : "";
    if (due && !validDate(due)) throw new Error("That due date doesn't look right.");
    const action = p.kind === "action";
    const category = p.category == null || p.category === "" ? null : (NOTE_CATEGORIES.find((c) => c.value === p.category)?.value ?? null);
    if (p.category && !category) throw new Error("Pick a category from the list.");
    if (category && (action || !optId(p.playerId, "Player"))) throw new Error("A category only applies to a note about a player.");
    return {
      ok: true,
      value: {
        kind: p.kind, category, body,
        playerId: optId(p.playerId, "Player"), practiceId: optId(p.practiceId, "Practice"), gameId: optId(p.gameId, "Game"),
        // Owner and due date only make sense for action items.
        owner: action ? optId(p.owner, "Owner") : null,
        due: action && due ? due : null,
      },
    };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Could not read the form." };
  }
}

export const isOverdue = (n: Pick<Note, "kind" | "status" | "due">, today: string) => n.kind === "action" && n.status === "open" && !!n.due && n.due < today;

/** Open action items first: overdue, then soonest due, then undated (newest first). */
export function byUrgency(a: Note, b: Note, today: string): number {
  const rank = (n: Note) => (isOverdue(n, today) ? 0 : n.due ? 1 : 2);
  return rank(a) - rank(b) || (a.due && b.due ? a.due.localeCompare(b.due) : 0) || b.created.localeCompare(a.created);
}

export function openActions(notes: Note[], today: string): Note[] {
  return notes.filter((n) => n.kind === "action" && n.status === "open").sort((a, b) => byUrgency(a, b, today));
}
