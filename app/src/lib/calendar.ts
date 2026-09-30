import { levelLabel, vsLabel } from "./games";
import type { Game } from "./db-types";
import type { Practice } from "./types";
import { mondayOf, practiceWindow, shiftWeek, slotStatus, suggestSource, weekSlots, type SlotStatus } from "./week";

export type CalView = "week" | "month";
export type CalKind = "all" | "practice" | "game";

export type CalItem = {
  kind: "practice" | "game";
  key: string; date: string; sort: number;
  title: string; detail: string; place?: string; badge: string;
  href: string;
  /** "6:55 PM", or "TBA" for a game with no time. */
  time: string;
  /** Practices only: an empty slot that still needs a plan, or a real practice with its state. */
  status?: SlotStatus; empty?: boolean;
  level?: Game["level"];
};

const addDays = (iso: string, n: number) => { const d = new Date(`${iso}T00:00:00Z`); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10); };
export const isIso = (s: unknown): s is string => typeof s === "string" && /^\d{4}-\d{2}-\d{2}$/.test(s) && !Number.isNaN(new Date(`${s}T00:00:00Z`).getTime()) && new Date(`${s}T00:00:00Z`).toISOString().slice(0, 10) === s;

/** Minutes since midnight to "5:30 PM"; the "no time yet" marker becomes "TBA". */
export function fmtMinutes(m: number): string {
  if (m >= 24 * 60) return "TBA";
  const h = Math.floor(m / 60) % 24;
  return `${h % 12 || 12}:${String(m % 60).padStart(2, "0")} ${h < 12 ? "AM" : "PM"}`;
}

/** "5:30 PM" to minutes since midnight; unknown times sort to the end of the day. */
export function clockMinutes(t: string | null): number {
  const m = t?.match(/^(\d{1,2}):(\d{2})\s*([AP])M$/i);
  if (!m) return 24 * 60;
  return ((Number(m[1]) % 12) + (m[3].toUpperCase() === "P" ? 12 : 0)) * 60 + Number(m[2]);
}

/** The days a view shows: a Monday-to-Sunday week, or every week that touches the month. */
export function viewDays(view: CalView, anchor: string): { first: string; last: string; days: string[]; label: string } {
  let first: string, last: string;
  if (view === "week") { first = mondayOf(anchor); last = addDays(first, 6); }
  else {
    const start = `${anchor.slice(0, 7)}-01`;
    const next = new Date(`${start}T00:00:00Z`); next.setUTCMonth(next.getUTCMonth() + 1);
    first = mondayOf(start); last = addDays(mondayOf(addDays(next.toISOString().slice(0, 10), -1)), 6);
  }
  const days: string[] = [];
  for (let d = first; d <= last; d = addDays(d, 1)) days.push(d);
  const label = view === "week"
    ? `${new Date(`${first}T00:00:00Z`).toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" })} – ${new Date(`${last}T00:00:00Z`).toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" })}`
    : new Date(`${anchor.slice(0, 7)}-01T00:00:00Z`).toLocaleDateString("en-US", { month: "long", year: "numeric", timeZone: "UTC" });
  return { first, last, days, label };
}

/** Move the window by one week or one month, always landing on a date inside the new window. */
export function shiftAnchor(view: CalView, anchor: string, by: -1 | 1): string {
  if (view === "week") return shiftWeek(mondayOf(anchor), by);
  const d = new Date(`${anchor.slice(0, 7)}-01T00:00:00Z`); d.setUTCMonth(d.getUTCMonth() + by);
  return d.toISOString().slice(0, 10);
}

/** Everything on the calendar for the window: practices (including empty slots that need a plan) and games at every level. */
export function calendarItems(view: CalView, anchor: string, practices: Practice[], games: Game[], now: { today: string; minutes: number }, show: CalKind = "all", level: "all" | Game["level"] = "all"): CalItem[] {
  const { days } = viewDays(view, anchor);
  const items: CalItem[] = [];
  if (show !== "game") {
    for (let i = 0; i < days.length; i += 7) {
      for (const day of weekSlots(days[i], practices)) {
        for (const s of day.slots) {
          const status = slotStatus(s.practice, day.date, now.today, now.minutes);
          if (s.practice) {
            items.push({ kind: "practice", key: `p-${s.practice.id}`, date: day.date, sort: practiceWindow(s.practice).start, title: `${s.session} practice`, detail: [s.practice.dress, s.practice.opponent && `vs ${s.practice.opponent}`].filter(Boolean).join(" · ") || "No details yet", badge: "Practice", href: `/practice/${s.practice.id}`, time: fmtMinutes(practiceWindow(s.practice).start), status });
          } else {
            // Empty slots are a planning prompt: only the next two weeks, never history.
            if ((status as SlotStatus) === "no-plan" || day.date > addDays(now.today, 14)) continue;
            const source = suggestSource(practices, day.date, s.session);
            items.push({ kind: "practice", key: `e-${day.date}-${s.session}`, date: day.date, sort: s.session === "School Day" ? 12 * 60 : 18 * 60, title: `${s.session} practice`, detail: "Needs a plan", badge: "Practice", href: `/practice/new?date=${day.date}&session=${encodeURIComponent(s.session)}${source ? `&from=${source.id}` : ""}`, time: s.session === "School Day" ? "Midday" : "Evening", status, empty: true });
          }
        }
      }
    }
  }
  if (show !== "practice") {
    for (const g of games) {
      if (g.date < days[0] || g.date > days[days.length - 1]) continue;
      if (level !== "all" && g.level !== level) continue;
      items.push({ kind: "game", key: `g-${g.id}`, date: g.date, sort: clockMinutes(g.time), title: vsLabel(g), detail: [g.time, g.location].filter(Boolean).join(" · ") || "Time to be set", place: g.location ?? undefined, badge: levelLabel(g.level), href: `/games/${g.id}`, time: fmtMinutes(clockMinutes(g.time)), level: g.level });
    }
  }
  return items.sort((a, b) => a.date.localeCompare(b.date) || a.sort - b.sort || a.key.localeCompare(b.key));
}
