export type PlayerInput = { first: string; last: string; grade: number; number: number; team: "jr" | "hs"; position: string | null; height: string | null; weight: number | null; confirmNumber: boolean };
export type CoachInput = { first: string | null; last: string; role: string; active: boolean };

type Ok<T> = { ok: true; value: T };
type Err = { ok: false; error: string };

const NAME = /^[\p{L}][\p{L}\s.'’-]*$/u;
const clean = (v: unknown, max: number, label: string, required: boolean): string => {
  const s = typeof v === "string" ? v.trim().replace(/\s+/g, " ") : "";
  if (required && !s) throw new Error(`${label} is required.`);
  if (s.length > max) throw new Error(`${label} is too long (max ${max} characters).`);
  if (s && !NAME.test(s)) throw new Error(`${label} can only have letters, spaces, hyphens and apostrophes.`);
  return s;
};

export function parsePlayerInput(input: unknown): Ok<PlayerInput> | Err {
  try {
    if (typeof input !== "object" || input === null) throw new Error("Nothing to save.");
    const p = input as Record<string, unknown>;
    const first = clean(p.first, 40, "First name", true);
    const last = clean(p.last, 40, "Last name", true);
    const team = p.team === "hs" ? "hs" : "jr";
    const grade = Number(p.grade);
    if (team === "jr" && grade !== 8 && grade !== 9) throw new Error("Grade should be 8 or 9.");
    if (team === "hs" && (!Number.isInteger(grade) || grade < 9 || grade > 12)) throw new Error("Grade should be 9 to 12.");
    const position = typeof p.position === "string" ? p.position.trim().toUpperCase().slice(0, 21) : "";
    if (position.length > 20) throw new Error("Position is too long (max 20 characters).");
    const height = typeof p.height === "string" ? p.height.trim() : "";
    if (height.length > 10) throw new Error("Height is too long.");
    const weightRaw = typeof p.weight === "string" ? p.weight.trim() : p.weight;
    const weight = weightRaw === "" || weightRaw == null ? null : Number(weightRaw);
    if (weight !== null && (!Number.isInteger(weight) || weight < 50 || weight > 500)) throw new Error("Weight should be 50 to 500 pounds.");
    const number = typeof p.number === "string" ? Number(p.number.trim() === "" ? NaN : p.number) : p.number;
    if (typeof number !== "number" || !Number.isInteger(number) || number < 0 || number > 99) throw new Error("Jersey number should be 0 to 99.");
    return { ok: true, value: { first, last, grade, number, team, position: position || null, height: height || null, weight, confirmNumber: p.confirmNumber === true } };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Could not read the form." };
  }
}

export function parseCoachInput(input: unknown): Ok<CoachInput> | Err {
  try {
    if (typeof input !== "object" || input === null) throw new Error("Nothing to save.");
    const p = input as Record<string, unknown>;
    const first = clean(p.first, 40, "First name", false);
    const last = clean(p.last, 40, "Last name", true);
    const role = typeof p.role === "string" ? p.role.trim() : "";
    if (role.length > 40) throw new Error("Role is too long (max 40 characters).");
    return { ok: true, value: { first: first || null, last, role: role || "Coach", active: p.active !== false } };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Could not read the form." };
  }
}

export const slugify = (s: string) => s.toLowerCase().normalize("NFKD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

/** A readable, unique id like "jordon-horn", or "jordon-horn-2" if that one is taken. */
export function uniqueId(base: string, taken: Iterable<string>): string {
  const used = new Set(taken);
  const root = slugify(base) || "item";
  if (!used.has(root)) return root;
  for (let i = 2; ; i++) if (!used.has(`${root}-${i}`)) return `${root}-${i}`;
}

/** Numbers that another player already wears (a soft warning, not a block). */
export function numberClashes<T extends { id: string; number: number }>(players: T[], selfId: string | null, number: number): T[] {
  return players.filter((p) => p.id !== selfId && p.number === number);
}
