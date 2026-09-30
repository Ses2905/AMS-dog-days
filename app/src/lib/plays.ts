export const PLAY_TYPES = [
  { value: "touchdown", label: "Touchdown", points: 6 },
  { value: "extra_point", label: "Extra Point", points: 1 },
  { value: "two_point", label: "2-Point Conversion", points: 2 },
  { value: "field_goal", label: "Field Goal", points: 3 },
  { value: "safety", label: "Safety", points: 2 },
] as const;
export type PlayType = (typeof PLAY_TYPES)[number]["value"];
export const QUARTERS = [1, 2, 3, 4, 5] as const;
export const quarterLabel = (q: number) => (q === 5 ? "OT" : `Q${q}`);
export const playLabel = (t: PlayType) => PLAY_TYPES.find((p) => p.value === t)?.label ?? t;

export type Play = { id: string; gameId: string; quarter: number; team: "us" | "them"; type: PlayType; points: number; playerId: string | null; scorerName: string | null; detail: string | null };
export type PlayInput = Omit<Play, "id" | "gameId">;

/** Points come from the kind of play, never from the form, so a typo can't skew the score. */
export function parsePlayInput(input: unknown, playerIds: Set<string>): { ok: true; value: PlayInput } | { ok: false; error: string } {
  if (typeof input !== "object" || input === null) return { ok: false, error: "Nothing to save." };
  const p = input as Record<string, unknown>;
  const type = PLAY_TYPES.find((t) => t.value === p.type);
  if (!type) return { ok: false, error: "Pick what kind of score it was." };
  const quarter = Number(p.quarter);
  if (!Number.isInteger(quarter) || quarter < 1 || quarter > 5) return { ok: false, error: "Pick a quarter." };
  if (p.team !== "us" && p.team !== "them") return { ok: false, error: "Pick who scored." };
  const text = (v: unknown, max: number, label: string) => {
    const s = typeof v === "string" ? v.trim().replace(/\s+/g, " ") : "";
    if (s.length > max) throw new Error(`${label} is too long (max ${max} characters).`);
    return s;
  };
  try {
    const playerId = p.team === "us" && typeof p.playerId === "string" && p.playerId ? p.playerId : null;
    if (playerId && !playerIds.has(playerId)) return { ok: false, error: "That player isn't on the roster." };
    const scorerName = playerId ? "" : text(p.scorerName, 60, "Name");
    const detail = text(p.detail, 200, "Details");
    return { ok: true, value: { quarter, team: p.team, type: type.value, points: type.points, playerId, scorerName: scorerName || null, detail: detail || null } };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Could not read the form." };
  }
}

export function totals(plays: Pick<Play, "team" | "points">[]) {
  return { us: plays.filter((p) => p.team === "us").reduce((n, p) => n + p.points, 0), them: plays.filter((p) => p.team === "them").reduce((n, p) => n + p.points, 0) };
}

export type Leader = { key: string; name: string; playerId: string | null; points: number; touchdowns: number; fieldGoals: number; conversions: number };

/** Season scoring by player. Players not on the roster are grouped by the name typed in. */
export function leaders(plays: Play[], nameOf: (id: string) => string | undefined): Leader[] {
  const map = new Map<string, Leader>();
  for (const p of plays) {
    if (p.team !== "us") continue;
    const name = (p.playerId ? nameOf(p.playerId) : p.scorerName) ?? "";
    if (!name) continue;
    const key = p.playerId ?? `n:${name.toLowerCase()}`;
    const l = map.get(key) ?? { key, name, playerId: p.playerId, points: 0, touchdowns: 0, fieldGoals: 0, conversions: 0 };
    l.points += p.points;
    if (p.type === "touchdown") l.touchdowns++;
    if (p.type === "field_goal") l.fieldGoals++;
    if (p.type === "extra_point" || p.type === "two_point") l.conversions++;
    map.set(key, l);
  }
  return [...map.values()].sort((a, b) => b.points - a.points || b.touchdowns - a.touchdowns || a.name.localeCompare(b.name));
}

export type Record4 = { level: string; wins: number; losses: number; ties: number; pf: number; pa: number };

/** Win-loss and points for/against per team, from finished games that have scores. */
export function seasonRecords(games: { level: string; status: string; scoreUs: number | null; scoreThem: number | null }[], order: string[]): Record4[] {
  return order.flatMap((level) => {
    const done = games.filter((g) => g.level === level && g.status === "final" && g.scoreUs !== null && g.scoreThem !== null);
    if (done.length === 0) return [];
    return [{
      level,
      wins: done.filter((g) => g.scoreUs! > g.scoreThem!).length,
      losses: done.filter((g) => g.scoreUs! < g.scoreThem!).length,
      ties: done.filter((g) => g.scoreUs === g.scoreThem).length,
      pf: done.reduce((n, g) => n + g.scoreUs!, 0),
      pa: done.reduce((n, g) => n + g.scoreThem!, 0),
    }];
  });
}
