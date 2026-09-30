export const SECTIONS = ["Opening Script", "Normal D&D", "Third Down", "Red Zone", "Goal Line", "Backed Up", "Two Minute", "Four Minute", "Coming Out", "Short Yardage", "Special Situations"] as const;

export type ScriptRow = {
  section: string; down: number | null; distance: string; hash: "" | "L" | "M" | "R";
  personnel: string; formation: string; motion: string; play: string; defense: string; notes: string; ran: boolean;
};
export type Script = { id: string; name: string; practiceId: string | null; gameId: string | null; updated: string; rows: ScriptRow[] };

export const blankRow = (section = ""): ScriptRow => ({ section, down: null, distance: "", hash: "", personnel: "", formation: "", motion: "", play: "", defense: "", notes: "", ran: false });

const ORDINAL = ["", "1st", "2nd", "3rd", "4th"];
/** "3rd & 6", "2nd", "& 6" or "". */
export const situation = (r: Pick<ScriptRow, "down" | "distance">) =>
  [r.down ? ORDINAL[r.down] : "", r.distance ? `& ${r.distance}` : ""].filter(Boolean).join(" ");

/** One line that says what the row is, for the collapsed list. */
export const rowSummary = (r: ScriptRow) => [situation(r), r.formation, r.motion, r.play].filter(Boolean).join(" · ") || "Empty row";

/** Copy a row directly below itself. */
export function duplicateRow(rows: ScriptRow[], i: number): ScriptRow[] {
  if (i < 0 || i >= rows.length) return rows;
  return [...rows.slice(0, i + 1), { ...rows[i], ran: false }, ...rows.slice(i + 1)];
}
export function moveRow(rows: ScriptRow[], i: number, by: -1 | 1): ScriptRow[] {
  const j = i + by;
  if (i < 0 || j < 0 || i >= rows.length || j >= rows.length) return rows;
  const next = [...rows];
  [next[i], next[j]] = [next[j], next[i]];
  return next;
}

const text = (v: unknown, max: number, label: string) => {
  if (v == null) return "";
  if (typeof v !== "string") throw new Error(`${label} must be text.`);
  const s = v.trim().replace(/[ \t]+/g, " ");
  if (s.length > max) throw new Error(`${label} is too long (max ${max} characters).`);
  return s;
};

export function parseName(v: unknown): { ok: true; value: string } | { ok: false; error: string } {
  try {
    const name = text(v, 80, "Name");
    return name ? { ok: true, value: name } : { ok: false, error: "Give the script a name, like “Thursday Install” or “Opening Script”." };
  } catch (e) { return { ok: false, error: e instanceof Error ? e.message : "Bad name." }; }
}

/** Server-side check of rows sent from the browser. */
export function parseRows(input: unknown): { ok: true; value: ScriptRow[] } | { ok: false; error: string } {
  try {
    if (!Array.isArray(input)) throw new Error("Nothing to save.");
    if (input.length > 200) throw new Error("That's a lot of plays (max 200 per script).");
    const rows = input.map((raw, i): ScriptRow => {
      const r = (raw ?? {}) as Record<string, unknown>;
      const n = `Row ${i + 1}`;
      const down = r.down === null || r.down === "" || r.down === undefined ? null : Number(r.down);
      if (down !== null && (!Number.isInteger(down) || down < 1 || down > 4)) throw new Error(`${n}: down should be 1 to 4.`);
      const hash = r.hash === undefined || r.hash === null ? "" : r.hash;
      if (hash !== "" && hash !== "L" && hash !== "M" && hash !== "R") throw new Error(`${n}: hash should be L, M or R.`);
      const row: ScriptRow = {
        section: text(r.section, 40, `${n} section`), down, distance: text(r.distance, 20, `${n} distance`), hash,
        personnel: text(r.personnel, 40, `${n} personnel`), formation: text(r.formation, 60, `${n} formation`), motion: text(r.motion, 60, `${n} motion`),
        play: text(r.play, 120, `${n} play`), defense: text(r.defense, 60, `${n} defense`), notes: text(r.notes, 300, `${n} notes`), ran: r.ran === true,
      };
      if (!row.play && !row.formation) throw new Error(`${n} needs a play or a formation. Fill it in or delete it.`);
      return row;
    });
    return { ok: true, value: rows };
  } catch (e) { return { ok: false, error: e instanceof Error ? e.message : "Could not read the script." }; }
}

/** Rows grouped by section in the order they appear, keeping each row's original index. */
export function groupBySection(rows: ScriptRow[]): { section: string; items: { row: ScriptRow; index: number }[] }[] {
  const out: { section: string; items: { row: ScriptRow; index: number }[] }[] = [];
  rows.forEach((row, index) => {
    const key = row.section || "No section";
    const last = out.at(-1);
    if (last && last.section === key) last.items.push({ row, index });
    else out.push({ section: key, items: [{ row, index }] });
  });
  return out;
}
