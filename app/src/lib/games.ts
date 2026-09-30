import { slugify } from "./roster-admin";
import type { Game, GameLink } from "./db-types";

export const CHECKLIST = [
  { key: "film", label: "Opponent film reviewed" },
  { key: "base", label: "Base plan done" },
  { key: "third", label: "Third down done" },
  { key: "redzone", label: "Red zone done" },
  { key: "special", label: "Special teams done" },
  { key: "scripts", label: "Scripts done" },
  { key: "callsheet", label: "Call sheet done" },
  { key: "install", label: "Player install done" },
] as const;
export type ChecklistKey = (typeof CHECKLIST)[number]["key"];
export const isChecklistKey = (k: unknown): k is ChecklistKey => CHECKLIST.some((c) => c.key === k);

export const SITES = ["home", "away", "neutral"] as const;
export const KINDS = ["game", "scrimmage", "other"] as const;
export const STATUSES = ["scheduled", "final", "postponed", "cancelled"] as const;

const validDate = (s: string) => {
  const d = new Date(`${s}T00:00:00Z`);
  return /^\d{4}-\d{2}-\d{2}$/.test(s) && !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === s;
};

/** "5:30pm", "5:30 PM", "530 pm" -> "5:30 PM". Returns null if it isn't a time. */
export function normalizeTime(raw: string): string | null {
  const m = raw.trim().match(/^(\d{1,2})(?::?(\d{2}))?\s*([ap])\.?m?\.?$/i);
  if (!m) return null;
  const h = Number(m[1]), min = Number(m[2] ?? "0");
  if (h < 1 || h > 12 || min > 59) return null;
  return `${h}:${String(min).padStart(2, "0")} ${m[3].toUpperCase()}M`;
}

export type GameInput = {
  date: string; time: string | null; opponent: string; site: (typeof SITES)[number]; location: string | null;
  kind: (typeof KINDS)[number]; status: (typeof STATUSES)[number]; scoreUs: number | null; scoreThem: number | null;
};

export function parseGameInput(input: unknown): { ok: true; value: GameInput } | { ok: false; error: string } {
  try {
    if (typeof input !== "object" || input === null) throw new Error("Nothing to save.");
    const p = input as Record<string, unknown>;
    const text = (v: unknown, max: number, label: string) => {
      const s = typeof v === "string" ? v.trim().replace(/\s+/g, " ") : "";
      if (s.length > max) throw new Error(`${label} is too long (max ${max} characters).`);
      return s;
    };
    const date = text(p.date, 10, "Date");
    if (!validDate(date)) throw new Error("Pick a date.");
    const opponent = text(p.opponent, 60, "Opponent");
    if (!opponent) throw new Error("Who are you playing?");
    if (!slugify(opponent)) throw new Error("The opponent name needs letters or numbers.");
    const timeRaw = text(p.time, 12, "Time");
    const time = timeRaw ? normalizeTime(timeRaw) : null;
    if (timeRaw && !time) throw new Error("Time should look like 7:00 PM.");
    const site = p.site as GameInput["site"], kind = p.kind as GameInput["kind"], status = p.status as GameInput["status"];
    if (!SITES.includes(site)) throw new Error("Pick home, away or neutral.");
    if (!KINDS.includes(kind)) throw new Error("Pick game, scrimmage or other.");
    if (!STATUSES.includes(status)) throw new Error("Pick a status.");
    const score = (v: unknown) => (v === "" || v == null ? null : Number(v));
    let scoreUs = score(p.scoreUs), scoreThem = score(p.scoreThem);
    if (status !== "final") { scoreUs = null; scoreThem = null; } // scores only count once it's final
    for (const s of [scoreUs, scoreThem]) if (s !== null && (!Number.isInteger(s) || s < 0 || s > 200)) throw new Error("Scores should be whole numbers, 0 to 200.");
    if ((scoreUs === null) !== (scoreThem === null)) throw new Error("Enter both scores, or leave both blank.");
    return { ok: true, value: { date, time, opponent, site, location: text(p.location, 80, "Location") || null, kind, status, scoreUs, scoreThem } };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Could not read the form." };
  }
}

/** Film and document links. Only web addresses are allowed, so a pasted link can never run code. */
export function parseLinks(input: unknown): { ok: true; value: GameLink[] } | { ok: false; error: string } {
  if (!Array.isArray(input)) return { ok: false, error: "Nothing to save." };
  if (input.length > 20) return { ok: false, error: "That's a lot of links (max 20)." };
  const out: GameLink[] = [];
  for (const raw of input) {
    const r = (raw ?? {}) as Record<string, unknown>;
    const urlText = typeof r.url === "string" ? r.url.trim() : "";
    let u: URL;
    try { u = new URL(/^[a-z][a-z0-9+.-]*:/i.test(urlText) ? urlText : `https://${urlText}`); } catch { return { ok: false, error: `“${urlText}” isn't a web address.` }; }
    if (u.protocol !== "https:" && u.protocol !== "http:") return { ok: false, error: "Links must start with http or https." };
    if (urlText.length > 500) return { ok: false, error: "That link is too long." };
    const label = (typeof r.label === "string" ? r.label.trim() : "").slice(0, 60) || u.hostname.replace(/^www\./, "");
    out.push({ label, url: u.toString() });
  }
  return { ok: true, value: out };
}

export function gameId(date: string, opponent: string, taken: Iterable<string>): string {
  const used = new Set(taken);
  const root = `${date}-${slugify(opponent)}`;
  if (!used.has(root)) return root;
  for (let i = 2; ; i++) if (!used.has(`${root}-${i}`)) return `${root}-${i}`;
}

export const prepProgress = (checklist: Record<string, boolean>) => ({ done: CHECKLIST.filter((c) => checklist[c.key]).length, total: CHECKLIST.length });

export const nextGame = (games: Game[], today: string) =>
  [...games].filter((g) => g.date >= today && g.status === "scheduled").sort((a, b) => a.date.localeCompare(b.date))[0];

export const vsLabel = (g: Pick<Game, "site" | "opponent">) => (g.site === "away" ? `@ ${g.opponent}` : g.site === "neutral" ? `vs ${g.opponent} (neutral)` : `vs ${g.opponent}`);

export function resultLabel(g: Pick<Game, "status" | "scoreUs" | "scoreThem">): string | null {
  if (g.status !== "final") return g.status === "postponed" ? "Postponed" : g.status === "cancelled" ? "Cancelled" : null;
  if (g.scoreUs === null || g.scoreThem === null) return "Final";
  return `${g.scoreUs > g.scoreThem ? "W" : g.scoreUs < g.scoreThem ? "L" : "T"} ${g.scoreUs}–${g.scoreThem}`;
}
