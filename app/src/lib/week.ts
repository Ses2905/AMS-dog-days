import type { Practice } from "./types";

/** Practices he normally runs: Monday to Thursday, a school-day and an evening session. Friday is game day. */
export const EXPECTED_SESSIONS = ["School Day", "Evening"];
const EXPECTED_WEEKDAYS = [1, 2, 3, 4]; // 0 = Sunday

const addDays = (iso: string, n: number) => {
  const d = new Date(`${iso}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
};
const weekday = (iso: string) => new Date(`${iso}T00:00:00Z`).getUTCDay();

export const mondayOf = (iso: string) => addDays(iso, -((weekday(iso) + 6) % 7));
export const shiftWeek = (monday: string, weeks: number) => addDays(monday, weeks * 7);

/** Practices start in the afternoon or evening: 12:xx stays 12, 1 to 11 mean pm. Returns minutes since midnight. */
export const toMinutes = (clock: string) => {
  const [h, m] = clock.split(":").map(Number);
  return (h === 12 ? 12 : h + 12) * 60 + m;
};

export const practiceWindow = (p: Practice) => {
  const total = p.blocks.reduce((sum, b) => sum + b.periods * 5, 0);
  const start = toMinutes(p.blocks[0]?.start ?? "12:00");
  return { start, end: start + total };
};

export type SlotStatus = "done" | "in-progress" | "later-today" | "planned" | "needs-plan" | "no-plan";

/** `today` is an ISO date and `nowMinutes` minutes since midnight, both in the school's time zone. */
export function slotStatus(practice: Practice | undefined, date: string, today: string, nowMinutes: number): SlotStatus {
  if (!practice) return date < today ? "no-plan" : "needs-plan";
  if (date < today) return "done";
  if (date > today) return "planned";
  const { start, end } = practiceWindow(practice);
  if (nowMinutes >= end) return "done";
  return nowMinutes >= start ? "in-progress" : "later-today";
}

export type Slot = { session: string; practice?: Practice };
export type Day = { date: string; slots: Slot[] };

export function weekSlots(monday: string, practices: Practice[]): Day[] {
  const days: Day[] = [];
  for (let i = 0; i < 7; i++) {
    const date = addDays(monday, i);
    const onDay = practices.filter((p) => p.date === date);
    const sessions = [...(EXPECTED_WEEKDAYS.includes(weekday(date)) ? EXPECTED_SESSIONS : []), ...onDay.map((p) => p.session)];
    const unique = [...new Set(sessions)];
    const slots = unique.map((session) => ({ session, practice: onDay.find((p) => p.session === session) }));
    slots.sort((a, b) => (a.practice ? practiceWindow(a.practice).start : EXPECTED_SESSIONS.indexOf(a.session) * 1000) - (b.practice ? practiceWindow(b.practice).start : EXPECTED_SESSIONS.indexOf(b.session) * 1000));
    if (slots.length > 0) days.push({ date, slots });
  }
  return days;
}

/** Best practice to copy into an empty slot: same session and weekday, else same session, else the latest one. */
export function suggestSource(practices: Practice[], date: string, session: string): Practice | undefined {
  const earlier = practices.filter((p) => p.date < date).sort((a, b) => b.date.localeCompare(a.date));
  return (
    earlier.find((p) => p.session === session && weekday(p.date) === weekday(date)) ??
    earlier.find((p) => p.session === session) ??
    earlier[0] ??
    [...practices].sort((a, b) => b.date.localeCompare(a.date))[0]
  );
}

export function nowInSchool(now = new Date()) {
  const parts = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Chicago", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).formatToParts(now);
  const get = (t: string) => parts.find((p) => p.type === t)!.value;
  return { today: `${get("year")}-${get("month")}-${get("day")}`, minutes: Number(get("hour")) * 60 + Number(get("minute")) };
}
