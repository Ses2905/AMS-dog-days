import { addMinutes } from "./time";

export type EditBlock = { periods: number; span?: string; flex?: boolean; lanes?: Record<string, string> };
export type EditPayload = {
  start: string;
  dress: string;
  lift: string;
  opponent: string;
  odMeeting: string;
  situations: string;
  coaches: string[];
  notes: string[];
  blocks: EditBlock[];
};

export const isClock = (t: string) => /^(1[0-2]|[1-9]):[0-5]\d$/.test(t);

/** Every block starts when the one before it ends, so changing a duration moves everything after it. */
export function startTimes(start: string, blocks: { periods: number }[]): string[] {
  let elapsed = 0;
  return blocks.map((b) => {
    const t = addMinutes(start, elapsed);
    elapsed += b.periods * 5;
    return t;
  });
}

type Result = { ok: true; value: EditPayload } | { ok: false; error: string };

const str = (v: unknown, max: number, label: string): string => {
  if (v == null) return "";
  if (typeof v !== "string") throw new Error(`${label} must be text.`);
  const s = v.trim();
  if (s.length > max) throw new Error(`${label} is too long (max ${max} characters).`);
  return s;
};

/** Server-side check of whatever the browser sent. Never trust the form. */
export function parsePayload(input: unknown): Result {
  try {
    if (typeof input !== "object" || input === null) throw new Error("Nothing to save.");
    const p = input as Record<string, unknown>;
    const start = str(p.start, 5, "Start time");
    if (!isClock(start)) throw new Error("Start time should look like 6:55 or 12:55.");

    const coaches = (Array.isArray(p.coaches) ? p.coaches : []).map((c) => str(c, 40, "Coach name")).filter(Boolean);
    if (coaches.length > 15) throw new Error("Too many coaches (max 15).");
    if (new Set(coaches).size !== coaches.length) throw new Error("Each coach name can only appear once.");

    const notes = (Array.isArray(p.notes) ? p.notes : []).map((n) => str(n, 300, "Note")).filter(Boolean);
    if (notes.length > 40) throw new Error("Too many notes (max 40).");

    if (!Array.isArray(p.blocks) || p.blocks.length === 0) throw new Error("A practice needs at least one period.");
    if (p.blocks.length > 60) throw new Error("Too many blocks (max 60).");
    const blocks: EditBlock[] = p.blocks.map((raw, i) => {
      const b = (raw ?? {}) as Record<string, unknown>;
      const periods = b.periods;
      if (typeof periods !== "number" || !Number.isInteger(periods) || periods < 1 || periods > 24)
        throw new Error(`Block ${i + 1}: length must be 1 to 24 five-minute periods.`);
      const span = str(b.span, 200, `Block ${i + 1} text`);
      const lanes: Record<string, string> = {};
      const rawLanes = (typeof b.lanes === "object" && b.lanes !== null ? b.lanes : {}) as Record<string, unknown>;
      for (const c of coaches) {
        const v = str(rawLanes[c], 120, `Block ${i + 1} (${c})`);
        if (v) lanes[c] = v;
      }
      const flex = b.flex === true;
      if (!span && Object.keys(lanes).length === 0) throw new Error(`Block ${i + 1} is empty. Add text or delete it.`);
      return span ? { periods, span, flex } : { periods, lanes, flex };
    });

    return {
      ok: true,
      value: {
        start, coaches, notes, blocks,
        dress: str(p.dress, 80, "Dress"),
        lift: str(p.lift, 120, "Lift"),
        opponent: str(p.opponent, 80, "Opponent"),
        odMeeting: str(p.odMeeting, 120, "O/D meeting"),
        situations: str(p.situations, 200, "Situations"),
      },
    };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Could not read the form." };
  }
}
