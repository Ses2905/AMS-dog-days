import type { Game } from "./db-types";
import type { Script } from "./scripts";
import type { Practice } from "./types";

const addDays = (iso: string, n: number) => { const d = new Date(`${iso}T00:00:00Z`); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10); };

export const BASE_PAGES = ["/", "/calendar", "/practice", "/games", "/roster", "/notes", "/scripts", "/depth", "/tools"];

/** The pages worth having on the phone with no signal: the main tabs, the next few days of practices and games, and the scripts that go with them. */
export function offlineUrls(today: string, practices: Pick<Practice, "id" | "date">[], games: Pick<Game, "id" | "date" | "status">[], scripts: Pick<Script, "id" | "practiceId" | "gameId" | "updated">[]): string[] {
  const soon = addDays(today, 3);
  const ps = practices.filter((p) => p.date >= today && p.date <= soon).sort((a, b) => a.date.localeCompare(b.date));
  const gs = games.filter((g) => g.date >= today && g.status !== "cancelled").sort((a, b) => a.date.localeCompare(b.date)).slice(0, 3);
  const ids = new Set([...ps.map((p) => p.id)]);
  const gameIds = new Set(gs.map((g) => g.id));
  const linked = scripts.filter((s) => (s.practiceId && ids.has(s.practiceId)) || (s.gameId && gameIds.has(s.gameId)));
  const recent = [...scripts].sort((a, b) => b.updated.localeCompare(a.updated)).slice(0, 3);
  const scriptIds = [...new Set([...linked, ...recent].map((s) => s.id))];
  const urls = [
    ...BASE_PAGES,
    ...ps.map((p) => `/practice/${p.id}`),
    ...gs.map((g) => `/games/${g.id}`),
    ...scriptIds.flatMap((id) => [`/scripts/${id}?view=sideline`, `/scripts/${id}`]),
  ];
  return [...new Set(urls)].slice(0, 30);
}
