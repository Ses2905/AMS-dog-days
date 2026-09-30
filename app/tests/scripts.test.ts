import assert from "node:assert/strict";
import { test } from "node:test";
import { blankRow, duplicateRow, groupBySection, moveRow, parseName, parseRows, rowSummary, situation } from "../src/lib/scripts";

const row = (o: object) => ({ ...blankRow(), play: "Dive", ...o });

test("situation and summary read like the sheet", () => {
  assert.equal(situation({ down: 3, distance: "6" }), "3rd & 6");
  assert.equal(situation({ down: 1, distance: "" }), "1st");
  assert.equal(situation({ down: null, distance: "Long" }), "& Long");
  assert.equal(rowSummary(row({ down: 2, distance: "4", formation: "Trips Right" })), "2nd & 4 · Trips Right · Dive");
});

test("duplicate and move keep order and never run past the ends", () => {
  const rows = [row({ play: "A", ran: true }), row({ play: "B" }), row({ play: "C" })];
  const d = duplicateRow(rows, 0);
  assert.deepEqual(d.map((r) => r.play), ["A", "A", "B", "C"]);
  assert.equal(d[1].ran, false); // a copy starts as not run
  assert.deepEqual(moveRow(rows, 0, -1), rows);
  assert.deepEqual(moveRow(rows, 2, 1), rows);
  assert.deepEqual(moveRow(rows, 0, 1).map((r) => r.play), ["B", "A", "C"]);
});

test("rows are validated on the server", () => {
  assert.ok(parseRows([{ play: "  Zone   Read ", down: "3", hash: "L", section: "Third Down" }]).ok);
  const r = parseRows([{ play: "Zone Read", down: "3" }]);
  assert.ok(r.ok && r.value[0].down === 3 && r.value[0].play === "Zone Read");
  assert.equal(parseRows([{ play: "x", down: 5 }]).ok, false);
  assert.equal(parseRows([{ play: "x", hash: "Q" }]).ok, false);
  assert.equal(parseRows([{ section: "Red Zone" }]).ok, false); // nothing to run
  assert.equal(parseRows([{ play: "x".repeat(121) }]).ok, false);
  assert.equal(parseRows(Array.from({ length: 201 }, () => ({ play: "x" }))).ok, false);
  assert.equal(parseRows("nope").ok, false);
});

test("names and grouping", () => {
  assert.equal(parseName("   ").ok, false);
  assert.ok(parseName(" Opening ").ok);
  const g = groupBySection([row({ section: "A" }), row({ section: "A" }), row({ section: "" }), row({ section: "A" })]);
  assert.deepEqual(g.map((x) => [x.section, x.items.map((i) => i.index)]), [["A", [0, 1]], ["No section", [2]], ["A", [3]]]);
});
