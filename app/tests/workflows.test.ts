import assert from "node:assert/strict";
import { test } from "node:test";
import { MockLanguageModelV4 } from "ai/test";
import { runWorkflow } from "../src/lib/ai/run";
import { checkScriptDraft } from "../src/lib/ai/schemas";
import { WORKFLOWS, focusContext, workflowById, workflowContext, workflowSystem } from "../src/lib/ai/workflows";
import { SKILL_TEXT } from "../src/lib/ai/skills";
import type { AssistantData } from "../src/lib/ai/context";

const usage = { inputTokens: { total: 1, noCache: 1, cacheRead: undefined, cacheWrite: undefined }, outputTokens: { total: 1, text: 1, reasoning: undefined } };
const seen: string[] = [];
const say = (text: string) => new MockLanguageModelV4({ doGenerate: async (o) => { seen.push(JSON.stringify(o.prompt)); return { content: [{ type: "text", text }], finishReason: { unified: "stop", raw: undefined }, usage, warnings: [] }; } });

const note = (id: string, category: string | null, body: string, extra: object = {}) => ({ id, kind: "note", category, body, status: "open", due: null, owner: null, playerId: "p1", practiceId: null, gameId: null, source: "manual", created: "2026-09-29T10:00:00Z", ...extra });
const data: AssistantData = {
  today: "2026-09-30",
  players: [{ id: "p1", first: "Marcus", last: "Hill", grade: 9, number: 12, otherNumbers: [], team: "jr", status: "out", statusNote: "sprained ankle" }, { id: "p2", first: "Eli", last: "Cook", grade: 8, number: 7, otherNumbers: [], team: "jr", status: "available" }],
  practices: [], docs: [], coaches: [],
  notes: [note("n1", "parent", "SECRET mom complaint"), note("n2", "performance", "Great tackling"), note("n3", "position", "Could play corner"), note("n4", null, "Won the game", { playerId: null, gameId: "g1" })] as never,
  games: [{ id: "g1", date: "2026-10-01", time: "5:30 PM", level: "jr", opponent: "Pea Ridge", site: "home", location: null, kind: "game", status: "scheduled", scoreUs: null, scoreThem: null, links: [], checklist: {} } as never],
  attendance: [{ practiceId: "x", playerId: "p1", mark: "present" }], plays: [{ id: "a", gameId: "g1", quarter: 2, team: "us", type: "touchdown", points: 6, playerId: "p1", scorerName: null, detail: null }],
};

test("every playbook has a skill behind it", () => {
  for (const w of WORKFLOWS) { assert.ok(SKILL_TEXT[w.skill], w.id); assert.ok(workflowSystem(w).includes(SKILL_TEXT[w.skill].slice(0, 40))); }
});

test("focus context uses number and last name only and never parent notes", () => {
  const all = [focusContext("player", "p1", data), focusContext("game", "g1", data), workflowContext(workflowById("depth")!, "", data, 30000), workflowContext(workflowById("player")!, "p1", data, 30000)].join("\n");
  assert.ok(all.includes("#12 Hill") && all.includes("Great tackling") && all.includes("Could play corner"));
  assert.ok(!all.includes("Marcus") && !all.includes("SECRET") && !all.includes("ankle"));
});

test("family messages get the schedule only", () => {
  const ctx = workflowContext(workflowById("comms")!, "g1", data, 30000);
  assert.ok(ctx.includes("Pea Ridge"));
  assert.ok(!ctx.includes("Hill") && !ctx.includes("Great tackling") && !ctx.includes("Cook"));
});

test("runWorkflow returns a document and rejects bad input", async () => {
  const ok = await runWorkflow(say("## Priorities\n- Fix red zone"), data, "postgame", "g1", "We lost 14-7");
  assert.ok(ok.ok && ok.value.kind === "document" && ok.value.title.includes("Pea Ridge"));
  assert.equal((await runWorkflow(say("x"), data, "postgame", "g1", "  ")).ok, false);
  assert.equal((await runWorkflow(say("x"), data, "nope", "", "hi")).ok, false);
  assert.equal((await runWorkflow(say("x"), data, "scout", "", "notes")).ok, false); // a game is required
  assert.equal((await runWorkflow(say("x"), data, "player", "zzz", "notes")).ok, false);
  assert.equal((await runWorkflow(say("x"), data, "week", "", "")).ok, true); // no input needed
});

test("script draft is cleaned with the same rules as a typed script", async () => {
  const d = { name: " Opening ", rows: [
    { section: "opening script", down: 1, distance: "10", hash: "m", personnel: "11", formation: "Trips", motion: "", play: "Zone Read", defense: "", notes: "" },
    { section: "Red Zone", down: 9, distance: "", hash: "Q", personnel: "", formation: "", motion: "", play: "Fade", defense: "", notes: "" },
    { section: "", down: null, distance: "", hash: "", personnel: "", formation: "", motion: "", play: "", defense: "", notes: "empty" },
  ] };
  const c = checkScriptDraft(d);
  assert.ok(c.ok);
  if (c.ok) { assert.equal(c.value.rows.length, 2); assert.equal(c.value.rows[0].section, "Opening Script"); assert.equal(c.value.rows[0].hash, "M"); assert.equal(c.value.rows[1].down, null); assert.equal(c.value.rows[1].hash, ""); assert.equal(c.value.dropped, 1); assert.equal(c.value.name, "Opening"); }
  assert.equal(checkScriptDraft({ name: "x", rows: [] }).ok, false);
  const r = await runWorkflow(say(JSON.stringify(d)), data, "script", "", "opening script");
  assert.ok(r.ok && r.value.kind === "script" && r.value.script.rows.length === 2);
});
