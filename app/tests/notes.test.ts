import assert from "node:assert/strict";
import { test } from "node:test";
import { buildContext } from "../src/lib/ai/context";
import { parseNoteInput } from "../src/lib/notes";
import { parseLinks } from "../src/lib/games";

test("player note categories: allowed on notes about a player only", () => {
  const ok = parseNoteInput({ kind: "note", category: "parent", body: "Mom called about playing time", playerId: "p1" });
  assert.ok(ok.ok && ok.value.category === "parent");
  assert.equal(parseNoteInput({ kind: "note", category: "performance", body: "x" }).ok, false); // no player
  assert.equal(parseNoteInput({ kind: "action", category: "performance", body: "x", playerId: "p1" }).ok, false);
  assert.equal(parseNoteInput({ kind: "note", category: "gossip", body: "x", playerId: "p1" }).ok, false);
  const plain = parseNoteInput({ kind: "note", category: "", body: "hello" });
  assert.ok(plain.ok && plain.value.category === null);
});

test("parent notes never reach the assistant", () => {
  const note = (id: string, category: string | null, body: string) => ({ id, kind: "note", category, body, status: "open", due: null, owner: null, playerId: "p1", practiceId: null, gameId: null, source: "manual", created: "2026-09-29T10:00:00Z" });
  const { text } = buildContext({
    today: "2026-09-30", players: [{ id: "p1", first: "A", last: "Hill", grade: 9, number: 12, otherNumbers: [], status: "available" }], practices: [], games: [], coaches: [], docs: [],
    notes: [note("n1", "parent", "SECRET parent complaint"), note("n2", "performance", "Great tackling")] as never,
  }, 30000);
  assert.ok(text.includes("Great tackling"));
  assert.ok(!text.includes("SECRET"));
});

test("tool links must be web addresses", () => {
  assert.equal(parseLinks([{ label: "x", url: "javascript:alert(1)" }]).ok, false);
  const r = parseLinks([{ label: "", url: "hudl.com" }]);
  assert.ok(r.ok && r.value[0].url === "https://hudl.com/");
});
