import { availabilityOn } from "./availability";
import { clockMinutes } from "./calendar";
import type { Game, Note } from "./db-types";
import { prepProgress, vsLabel, levelLabel } from "./games";
import { isOverdue, openActions } from "./notes";
import { prettyDate } from "./time";
import type { Player, Practice } from "./types";
import { practiceWindow, slotStatus } from "./week";

const addDays = (iso: string, n: number) => { const d = new Date(`${iso}T00:00:00Z`); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10); };
const dayNumber = (iso: string) => Math.round(new Date(`${iso}T00:00:00Z`).getTime() / 86_400_000);

export type NextUp = {
  kind: "practice" | "game";
  id: string; date: string; startMin: number; endMin: number;
  title: string; meta: string; href: string; when: string; live: boolean;
};

/** "Starts in 1 hr 10 min", "In progress", "Tomorrow", "Friday". */
export function whenLabel(date: string, startMin: number, endMin: number, now: { today: string; minutes: number }): string {
  const days = dayNumber(date) - dayNumber(now.today);
  if (days === 0) {
    if (now.minutes >= startMin && now.minutes < endMin) return "In progress";
    const left = startMin - now.minutes;
    if (left <= 0) return "Today";
    if (left < 60) return `Starts in ${left} min`;
    const h = Math.floor(left / 60), m = left % 60;
    return `Starts in ${h} hr${m ? ` ${m} min` : ""}`;
  }
  if (days === 1) return "Tomorrow";
  return prettyDate(date).split(",")[0];
}

/** The soonest thing that has not finished yet, whether it is a practice or a game. */
export function nextUp(now: { today: string; minutes: number }, practices: Practice[], games: Game[]): NextUp | null {
  const events: NextUp[] = [];
  for (const p of practices) {
    if (p.date < now.today || !p.blocks.length) continue;
    const w = practiceWindow(p);
    if (p.date === now.today && now.minutes >= w.end) continue;
    events.push({
      kind: "practice", id: p.id, date: p.date, startMin: w.start, endMin: w.end, live: p.date === now.today && now.minutes >= w.start,
      title: `${p.session} Practice`, meta: [p.dress, p.opponent && `${p.opponent} week`].filter(Boolean).join(" · ") || "No details yet",
      href: `/practice/${p.id}`, when: whenLabel(p.date, w.start, w.end, now),
    });
  }
  for (const g of games) {
    if (g.date < now.today || g.status !== "scheduled") continue;
    const start = clockMinutes(g.time);
    const s = start === 24 * 60 ? 12 * 60 : start;
    const end = s + 150;
    if (g.date === now.today && now.minutes >= end) continue;
    events.push({
      kind: "game", id: g.id, date: g.date, startMin: s, endMin: end, live: g.date === now.today && now.minutes >= s,
      title: `${levelLabel(g.level)} ${vsLabel(g)}`, meta: [g.time, g.location].filter(Boolean).join(" · ") || "Time to be set",
      href: `/games/${g.id}`, when: whenLabel(g.date, s, end, now),
    });
  }
  events.sort((a, b) => a.date.localeCompare(b.date) || a.startMin - b.startMin);
  return events[0] ?? null;
}

export type Attention = { key: string; title: string; meta: string; href: string; urgent: boolean; badge?: string };

/** What needs him, most urgent first: overdue items, today's attendance, missing plans in the next three days, game prep, players out. */
export function attention(now: { today: string; minutes: number }, data: { practices: Practice[]; games: Game[]; notes: Note[]; players: Player[]; attendedIds: Set<string>; missingPlans: { date: string; session: string }[] }): Attention[] {
  const out: Attention[] = [];
  for (const n of openActions(data.notes, now.today).filter((x) => isOverdue(x, now.today)).slice(0, 2)) {
    out.push({ key: `n-${n.id}`, title: n.body.length > 70 ? `${n.body.slice(0, 70)}…` : n.body, meta: `Overdue since ${prettyDate(n.due!)}`, href: "/notes?show=open", urgent: true, badge: "Overdue" });
  }
  for (const p of data.practices.filter((x) => x.date === now.today)) {
    const w = practiceWindow(p);
    if (now.minutes >= w.start - 30 && !data.attendedIds.has(p.id)) out.push({ key: `a-${p.id}`, title: `Take attendance for ${p.session}`, meta: "Not taken yet", href: `/practice/${p.id}#attendance`, urgent: now.minutes >= w.start, badge: "Today" });
  }
  for (const m of data.missingPlans.slice(0, 2)) {
    out.push({ key: `m-${m.date}-${m.session}`, title: `${m.session} practice needs a plan`, meta: prettyDate(m.date), href: `/practice/new?date=${m.date}&session=${encodeURIComponent(m.session)}`, urgent: m.date <= addDays(now.today, 1), badge: m.date <= now.today ? "Today" : "Tomorrow" });
  }
  const g = data.games.filter((x) => x.status === "scheduled" && x.date >= now.today && x.date <= addDays(now.today, 3)).sort((a, b) => a.date.localeCompare(b.date))[0];
  if (g) {
    const p = prepProgress(g.checklist);
    if (p.done < p.total) out.push({ key: `g-${g.id}`, title: `${levelLabel(g.level)} ${vsLabel(g)}: prep ${p.done} of ${p.total}`, meta: prettyDate(g.date), href: `/games/${g.id}`, urgent: g.date <= addDays(now.today, 1), badge: g.date <= now.today ? "Today" : "Tomorrow" });
  }
  const a = availabilityOn(data.players, now.today);
  const away = a.out.length + a.limited.length + a.excused.length;
  if (away > 0) out.push({ key: "avail", title: `${away} player${away === 1 ? "" : "s"} not fully available`, meta: [a.out.length && `${a.out.length} out`, a.limited.length && `${a.limited.length} limited`, a.excused.length && `${a.excused.length} excused`].filter(Boolean).join(" · "), href: "/roster", urgent: false });
  return out.sort((x, y) => Number(y.urgent) - Number(x.urgent)).slice(0, 4);
}

export { slotStatus };
