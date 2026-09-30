import assert from "node:assert/strict";
import { test } from "node:test";
import { leaders, parsePlayInput, seasonRecords, totals, type Play } from "../src/lib/plays";

const ids = new Set(["p1", "p2"]);
const play = (o: Partial<Play>): Play => ({ id: "x", gameId: "g", quarter: 1, team: "us", type: "touchdown", points: 6, playerId: null, scorerName: null, detail: null, ...o });

test("points come from the type, not the form", () => {
  const r = parsePlayInput({ type: "field_goal", points: 99, quarter: 2, team: "us", playerId: "p1" }, ids);
  assert.ok(r.ok && r.value.points === 3 && r.value.playerId === "p1");
});

test("play validation", () => {
  assert.equal(parsePlayInput({ type: "touchdown", quarter: 6, team: "us" }, ids).ok, false);
  assert.equal(parsePlayInput({ type: "dunk", quarter: 1, team: "us" }, ids).ok, false);
  assert.equal(parsePlayInput({ type: "touchdown", quarter: 1, team: "them2" }, ids).ok, false);
  assert.equal(parsePlayInput({ type: "touchdown", quarter: 1, team: "us", playerId: "nope" }, ids).ok, false);
  const opp = parsePlayInput({ type: "touchdown", quarter: 1, team: "them", playerId: "p1", scorerName: " #5  Smith " }, ids);
  assert.ok(opp.ok && opp.value.playerId === null && opp.value.scorerName === "#5 Smith"); // opponents never link to our roster
});

test("totals, leaders and records", () => {
  const plays = [play({ playerId: "p1" }), play({ playerId: "p1", type: "extra_point", points: 1 }), play({ playerId: "p2", type: "field_goal", points: 3 }), play({ scorerName: "JV #22" }), play({ team: "them" })];
  assert.deepEqual(totals(plays), { us: 16, them: 6 });
  const l = leaders(plays, (id) => ({ p1: "#1 A", p2: "#2 B" })[id]);
  assert.deepEqual(l.map((x) => [x.name, x.points, x.touchdowns, x.conversions]), [["#1 A", 7, 1, 1], ["JV #22", 6, 1, 0], ["#2 B", 3, 0, 0]]);
  const rec = seasonRecords([
    { level: "jr", status: "final", scoreUs: 20, scoreThem: 7 }, { level: "jr", status: "final", scoreUs: 6, scoreThem: 14 },
    { level: "jr", status: "scheduled", scoreUs: null, scoreThem: null }, { level: "varsity", status: "final", scoreUs: 21, scoreThem: 21 },
  ], ["jr", "jrjv", "varsity"]);
  assert.deepEqual(rec.map((r) => [r.level, r.wins, r.losses, r.ties, r.pf, r.pa]), [["jr", 1, 1, 0, 26, 21], ["varsity", 0, 0, 1, 21, 21]]);
});
