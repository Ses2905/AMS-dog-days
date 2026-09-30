import assert from "node:assert/strict";
import { test } from "node:test";
import { calendarItems, clockMinutes, isIso, shiftAnchor, viewDays } from "../src/lib/calendar";

const game = (id: string, date: string, time: string | null, level = "varsity") => ({ id, date, time, level, opponent: "X", site: "home", location: null, kind: "game", status: "scheduled", scoreUs: null, scoreThem: null, links: [], checklist: {} }) as never;
const practice = (id: string, date: string, session: string) => ({ id, date, session, team: "T", dress: "Helmets", coaches: [], notes: [], blocks: [{ start: session === "Evening" ? "6:55" : "12:55", periods: 12, span: "x" }] }) as never;
const now = { today: "2026-09-30", minutes: 600 };

test("time and date helpers", () => {
  assert.equal(clockMinutes("5:30 PM"), 17 * 60 + 30);
  assert.equal(clockMinutes("12:05 AM"), 5);
  assert.equal(clockMinutes(null), 24 * 60);
  assert.ok(isIso("2026-02-28") && !isIso("2026-02-30") && !isIso("soon"));
});

test("week and month windows", () => {
  const w = viewDays("week", "2026-09-30");
  assert.deepEqual([w.first, w.last, w.days.length], ["2026-09-28", "2026-10-04", 7]);
  const m = viewDays("month", "2026-09-30");
  assert.equal(m.days.length % 7, 0);
  assert.ok(m.days[0] <= "2026-09-01" && m.days.at(-1)! >= "2026-09-30");
  assert.equal(m.label, "September 2026");
  assert.equal(shiftAnchor("month", "2026-12-15", 1), "2027-01-01");
  assert.equal(shiftAnchor("week", "2026-09-30", -1), "2026-09-21");
});

test("calendar mixes practices, empty slots and games in order", () => {
  const items = calendarItems("week", "2026-09-30", [practice("p1", "2026-09-30", "Evening")], [game("g1", "2026-10-01", "7:00 PM"), game("g2", "2026-10-01", "5:30 PM", "jr"), game("far", "2026-11-01", "7:00 PM")], now);
  const day = items.filter((i) => i.date === "2026-10-01");
  assert.deepEqual(day.filter((i) => i.kind === "game").map((i) => i.key), ["g-g2", "g-g1"]); // earlier game first
  assert.ok(items.some((i) => i.key === "p-p1" && i.status === "in-progress" || i.key === "p-p1"));
  assert.ok(items.some((i) => i.empty && i.href.startsWith("/practice/new?date=2026-09-30&session=School")));
  assert.ok(!items.some((i) => i.key === "g-far"));
});

test("empty practice slots only show for the next two weeks, never for the past", () => {
  const items = calendarItems("month", "2026-09-30", [], [], now);
  assert.ok(items.every((i) => i.date >= "2026-09-30" && i.date <= "2026-10-14"));
  assert.ok(items.length > 0 && items.every((i) => i.empty));
});

test("filters", () => {
  const games = [game("a", "2026-10-01", "7:00 PM", "varsity"), game("b", "2026-10-01", "5:30 PM", "jr")];
  assert.ok(calendarItems("week", "2026-09-30", [], games, now, "game").every((i) => i.kind === "game"));
  assert.ok(calendarItems("week", "2026-09-30", [], games, now, "practice").every((i) => i.kind === "practice"));
  assert.deepEqual(calendarItems("week", "2026-09-30", [], games, now, "game", "jr").map((i) => i.key), ["g-b"]);
});
