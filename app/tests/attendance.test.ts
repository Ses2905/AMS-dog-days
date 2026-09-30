import assert from "node:assert/strict";
import { test } from "node:test";
import { bulkPresentTargets, isMark, playerSummary, tally } from "../src/lib/attendance";

test("tally counts late as there", () => {
  const t = tally(["present", "late", "absent", "excused"], 10);
  assert.deepEqual([t.marked, t.unmarked, t.there, t.absent, t.excused], [4, 6, 2, 1, 1]);
});

test("everyone present skips marked, out and excused players, honours the until date", () => {
  const p = (id: string, status: string, statusUntil?: string) => ({ id, status: status as never, statusUntil });
  const ids = bulkPresentTargets([p("a", "available"), p("b", "out"), p("c", "excused"), p("d", "limited"), p("e", "available"), p("f", "out", "2026-09-01")], new Set(["e"]), "2026-10-01");
  assert.deepEqual(ids, ["a", "d", "f"]); // f's "out" ended before the date
});

test("player summary: excused days don't count against him", () => {
  const s = playerSummary([{ mark: "present", date: "1" }, { mark: "late", date: "2" }, { mark: "absent", date: "3" }, { mark: "excused", date: "4" }]);
  assert.deepEqual([s.counted, s.there, s.pct, s.excused], [3, 2, 67, 1]);
  assert.equal(playerSummary([]).pct, null);
  assert.equal(playerSummary([{ mark: "excused", date: "1" }]).pct, null);
});

test("marks are validated", () => {
  assert.ok(isMark("late"));
  assert.ok(!isMark("tardy") && !isMark(null));
});
