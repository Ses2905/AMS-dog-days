import assert from "node:assert/strict";
import { test } from "node:test";
import { focusMonday, weekAhead } from "../src/lib/week-ahead";

const practice = (id: string, date: string, session: string) => ({ id, date, session, team: "T", dress: "H", coaches: [], notes: [], blocks: [{ start: "12:55", periods: 12, span: "x" }] }) as never;
const game = (id: string, date: string) => ({ id, date, time: "5:30 PM", level: "jr", opponent: "X", site: "home", location: null, kind: "game", status: "scheduled", scoreUs: null, scoreThem: null, links: [], checklist: {} }) as never;
const note = (id: string, due: string | null) => ({ id, kind: "action", status: "open", due, body: "b" }) as never;
const now = { today: "2026-09-28", minutes: 480 }; // Monday morning

test("weekends look ahead, weekdays stay put", () => {
  assert.equal(focusMonday("2026-09-30"), "2026-09-28");
  assert.equal(focusMonday("2026-10-03"), "2026-10-05");
  assert.equal(focusMonday("2026-10-04"), "2026-10-05");
});

test("counts plans, games and actions for the week", () => {
  const w = weekAhead(now, {
    practices: [practice("a", "2026-09-28", "School Day")],
    games: [game("g1", "2026-10-01"), game("g2", "2026-10-09")],
    notes: [note("n1", "2026-09-20"), note("n2", "2026-09-30"), note("n3", null)],
    players: [],
  });
  assert.equal(w.missing.length, 7); // 8 Mon-Thu slots minus the one planned
  assert.equal(w.games.length, 1);
  assert.equal(w.overdue.length, 1);
  assert.equal(w.dueThisWeek.length, 1);
  assert.match(w.headline, /7 practices still need a plan/);
});

test("a fully planned week says so", () => {
  const ps = ["2026-09-28", "2026-09-29", "2026-09-30", "2026-10-01"].flatMap((d) => [practice(`${d}a`, d, "School Day"), practice(`${d}b`, d, "Evening")]);
  const w = weekAhead(now, { practices: ps, games: [], notes: [], players: [] });
  assert.equal(w.missing.length, 0);
  assert.equal(w.headline, "Every practice has a plan");
});
