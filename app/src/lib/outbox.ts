import { isMark, type Mark } from "./attendance";

/** One attendance tap that could not reach the server yet. The last tap per player wins, so retrying is always safe. */
export type Pending = { practiceId: string; playerId: string; mark: Mark | null; at: number };

export const OUTBOX_KEY = "coach-os-outbox";
const KEEP_MS = 3 * 24 * 60 * 60 * 1000;

const sameSlot = (a: Pending, b: Pending) => a.practiceId === b.practiceId && a.playerId === b.playerId;

/** Reads what was stored. Anything malformed or older than three days is ignored, so a bad value can never block a save. */
export function parseOutbox(raw: string | null, now: number): Pending[] {
  if (!raw) return [];
  try {
    const list: unknown = JSON.parse(raw);
    if (!Array.isArray(list)) return [];
    return list.filter((p): p is Pending => typeof p === "object" && p !== null
      && typeof p.practiceId === "string" && typeof p.playerId === "string" && typeof p.at === "number"
      && (p.mark === null || isMark(p.mark)) && now - p.at < KEEP_MS);
  } catch { return []; }
}

/** A newer tap for the same player replaces the older one. */
export const addPending = (list: Pending[], p: Pending): Pending[] => [...list.filter((x) => !sameSlot(x, p)), p];

/** Removes an entry once it is saved, unless the coach tapped that player again while it was sending. */
export const dropPending = (list: Pending[], p: Pending): Pending[] => list.filter((x) => !(sameSlot(x, p) && x.at === p.at));

/** What the screen should show: the saved marks with the waiting taps applied on top. */
export function withPending(marks: Record<string, Mark>, list: Pending[], practiceId: string): Record<string, Mark> {
  const out = { ...marks };
  for (const p of list) if (p.practiceId === practiceId) { if (p.mark) out[p.playerId] = p.mark; else delete out[p.playerId]; }
  return out;
}
