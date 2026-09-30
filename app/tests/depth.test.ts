import assert from "node:assert/strict";
import { test } from "node:test";
import { analyze, parsePosition, reorder, type DepthPosition, type DepthSlot } from "../src/lib/depth";

const pl = (id: string, number: number, status = "available", statusUntil?: string) => ({ id, first: "F", last: `L${number}`, grade: 9, number, otherNumbers: [], status, statusUntil }) as never;
const players = [pl("a", 1), pl("b", 2, "out"), pl("c", 3, "limited"), pl("d", 4), pl("e", 5, "out", "2026-09-01")];
const pos = (id: string, name: string, starters: number, sort = 0): DepthPosition => ({ id, unit: "offense", name, starters, sort });
const positions = [pos("qb", "QB", 1, 0), pos("rb", "RB", 1, 1), pos("wr", "WR", 3, 2)];
const slots: DepthSlot[] = [
  { positionId: "qb", playerId: "a", rank: 0 }, { positionId: "qb", playerId: "b", rank: 1 },
  { positionId: "rb", playerId: "a", rank: 0 }, { positionId: "rb", playerId: "c", rank: 1 },
  { positionId: "wr", playerId: "d", rank: 5 }, { positionId: "wr", playerId: "e", rank: 2 },
];

test("analyze ranks, flags injuries, dual roles and depth", () => {
  const { rows, unplaced } = analyze(positions, slots, players, "2026-09-30");
  const [qb, rb, wr] = rows;
  assert.deepEqual(qb.players.map((x) => x.player.id), ["a", "b"]);
  assert.equal(qb.players[1].unavailable, "out");
  assert.equal(qb.depth, "thin"); // 1 usable of 2 needed for a full two-deep
  assert.deepEqual(qb.players[0].alsoAt, ["RB"]);
  assert.equal(rb.depth, "ok"); // limited still counts
  assert.deepEqual(wr.players.map((x) => x.player.id), ["e", "d"]); // rank order, not insert order; e's "out" ended
  assert.equal(wr.depth, "short");
  assert.deepEqual(unplaced.map((p) => p.id), []);
});

test("unplaced players and out starters", () => {
  const { rows, unplaced } = analyze([pos("qb", "QB", 1)], [{ positionId: "qb", playerId: "b", rank: 0 }], players, "2026-09-30");
  assert.equal(rows[0].depth, "short");
  assert.deepEqual(unplaced.map((p) => p.id).sort(), ["a", "c", "d", "e"]);
});

test("reorder stays inside the list", () => {
  assert.deepEqual(reorder(["a", "b", "c"], "b", -1), ["b", "a", "c"]);
  assert.deepEqual(reorder(["a", "b", "c"], "a", -1), ["a", "b", "c"]);
  assert.deepEqual(reorder(["a", "b", "c"], "c", 1), ["a", "b", "c"]);
  assert.deepEqual(reorder(["a", "b"], "zz", 1), ["a", "b"]);
});

test("position input is validated", () => {
  assert.ok(parsePosition({ unit: "defense", name: "  Nose   Guard ", starters: "1" }).ok);
  assert.equal(parsePosition({ unit: "defense", name: "", starters: 1 }).ok, false);
  assert.equal(parsePosition({ unit: "band", name: "x", starters: 1 }).ok, false);
  assert.equal(parsePosition({ unit: "offense", name: "x", starters: 12 }).ok, false);
  assert.equal(parsePosition({ unit: "offense", name: "x".repeat(31), starters: 1 }).ok, false);
});
