import { availabilityOn } from "./availability";
import type { Game, Note } from "./db-types";
import { levelLabel, prepProgress, vsLabel } from "./games";
import { isOverdue } from "./notes";
import type { Player, Practice } from "./types";
import { mondayOf, shiftWeek, slotStatus, weekSlots } from "./week";

const addDays = (iso: string, n: number) => { const d = new Date(`${iso}T00:00:00Z`); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10); };
const weekday = (iso: string) => new Date(`${iso}T00:00:00Z`).getUTCDay();

/** Saturday and Sunday look ahead to the coming week; every other day shows the current week. */
export const focusMonday = (today: string) => (weekday(today) === 6 || weekday(today) === 0 ? shiftWeek(mondayOf(today), 1) : mondayOf(today));

export type WeekAhead = {
  monday: string; sunday: string;
  practices: { date: string; session: string; id?: string; planned: boolean }[];
  missing: { date: string; session: string }[];
  games: { id: string; date: string; title: string; prep: string; prepDone: boolean }[];
  overdue: Note[];
  dueThisWeek: Note[];
  away: { out: number; limited: number; excused: number };
  headline: string;
};

/** Everything he should know before the week starts, from data already in the app. No AI, no guessing. */
export function weekAhead(now: { today: string; minutes: number }, data: { practices: Practice[]; games: Game[]; notes: Note[]; players: Player[] }): WeekAhead {
  const monday = focusMonday(now.today), sunday = addDays(monday, 6);
  const days = weekSlots(monday, data.practices);
  const practices = days.flatMap((d) => d.slots
    .filter((s) => d.date >= now.today || s.practice)
    .map((s) => ({ date: d.date, session: s.session, id: s.practice?.id, planned: !!s.practice })));
  const missing = days.flatMap((d) => d.slots
    .filter((s) => slotStatus(s.practice, d.date, now.today, now.minutes) === "needs-plan")
    .map((s) => ({ date: d.date, session: s.session })));
  const games = data.games
    .filter((g) => g.status === "scheduled" && g.date >= monday && g.date <= sunday && g.date >= now.today)
    .sort((a, b) => a.date.localeCompare(b.date))
    .map((g) => { const p = prepProgress(g.checklist); return { id: g.id, date: g.date, title: `${levelLabel(g.level)} ${vsLabel(g)}`, prep: `${p.done} of ${p.total} prep items`, prepDone: p.done === p.total }; });
  const open = data.notes.filter((n) => n.kind === "action" && n.status === "open");
  const overdue = open.filter((n) => isOverdue(n, now.today));
  const dueThisWeek = open.filter((n) => n.due && n.due >= now.today && n.due <= sunday);
  const a = availabilityOn(data.players, monday > now.today ? monday : now.today);
  const away = { out: a.out.length, limited: a.limited.length, excused: a.excused.length };
  const bits: string[] = [];
  bits.push(missing.length ? `${missing.length} practice${missing.length === 1 ? "" : "s"} still need a plan` : practices.length ? "Every practice has a plan" : "No practices scheduled");
  if (games.length) bits.push(`${games.length} game${games.length === 1 ? "" : "s"}`);
  if (overdue.length) bits.push(`${overdue.length} overdue`);
  return { monday, sunday, practices, missing, games, overdue, dueThisWeek, away, headline: bits.join(" · ") };
}
