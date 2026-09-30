import assert from "node:assert/strict";
import { test } from "node:test";
import { MockLanguageModelV4 } from "ai/test";
import { explain, runAsk, runDraft, runTranscript } from "../src/lib/ai/run";
import { buildContext } from "../src/lib/ai/context";
import type { AssistantData } from "../src/lib/ai/context";

const usage = { inputTokens: { total: 1, noCache: 1, cacheRead: undefined, cacheWrite: undefined }, outputTokens: { total: 1, text: 1, reasoning: undefined } };
const say = (text: string) => new MockLanguageModelV4({ doGenerate: async () => ({ content: [{ type: "text", text }], finishReason: { unified: "stop", raw: undefined }, usage, warnings: [] }) });
const prompts: string[] = [];
const spy = (text: string) => new MockLanguageModelV4({ doGenerate: async (o) => { prompts.push(JSON.stringify(o.prompt)); return { content: [{ type: "text", text }], finishReason: { unified: "stop", raw: undefined }, usage, warnings: [] }; } });
const boom = (m: string, statusCode?: number) => new MockLanguageModelV4({ doGenerate: async () => { throw Object.assign(new Error(m), { statusCode }); } });

const data: AssistantData = {
  today: "2026-09-30",
  players: [
    { id: "p1", first: "Marcus", last: "Hill", grade: 9, number: 12, otherNumbers: [], status: "out", statusNote: "sprained ankle", statusUntil: "2026-10-05" },
    { id: "p2", first: "Eli", last: "Cook", grade: 8, number: 7, otherNumbers: [], status: "available" },
  ],
  practices: [], notes: [], docs: [],
  games: [{ id: "g1", date: "2026-10-01", time: "5:30 PM", level: "jr", opponent: "Pea Ridge", site: "home", location: null, kind: "game", status: "scheduled", scoreUs: null, scoreThem: null, links: [], checklist: {} } as never],
  coaches: [{ id: "c1", first: "Josh", last: "Barrett", role: "OC", active: true } as never, { id: "c2", first: "Zach", last: "Jones", role: "RB", active: false } as never],
};

test("context never includes first names or status reasons", () => {
  const { text } = buildContext(data, 30000);
  assert.ok(text.includes("#12 Hill"));
  assert.ok(!text.includes("Marcus") && !text.includes("ankle"));
});

test("ask: turns tags into source links and strips them", async () => {
  const r = await runAsk(say("Pea Ridge prep is not started [G:g1]."), data, "What's next?");
  assert.ok(r.ok);
  if (r.ok) { assert.equal(r.value.answer, "Pea Ridge prep is not started."); assert.equal(r.value.sources[0].href, "/games/g1"); }
});

test("ask: rejects empty and oversized questions, explains failures", async () => {
  assert.equal((await runAsk(say("x"), data, "  ")).ok, false);
  assert.equal((await runAsk(say("x"), data, "a".repeat(1001))).ok, false);
  const r = await runAsk(boom("Unauthorized", 401), data, "hi");
  assert.ok(!r.ok && /key/i.test(r.error));
});

const draftJson = (o: object) => JSON.stringify({ dress: "Helmets", lift: "", opponent: "", notes: [], reasoning: "Short.", blocks: [], ...o });

test("draft: keeps valid lanes, drops unknown coaches, warns on wrong total", async () => {
  const out = draftJson({ blocks: [
    { periods: 2, span: "Stretch", lanes: [] },
    { periods: 4, span: "", lanes: [{ coach: "barrett", text: "QB drills" }, { coach: "Nobody", text: "x" }, { coach: "Jones", text: "inactive" }] },
    { periods: 1, span: "End of Practice", lanes: [] },
  ] });
  const r = await runDraft(say(out), data, { date: "2026-10-01", session: "Evening", start: "6:55", minutes: 60 }, "Install screen");
  assert.ok(r.ok);
  if (r.ok) {
    assert.deepEqual(r.value.payload.coaches, ["Barrett"]);
    assert.equal(r.value.warnings.length, 3); // two dropped, one total mismatch (35 vs 60)
    assert.equal(r.value.practice.blocks[1].start, "7:05");
  }
});

test("draft: validates request and unusable output", async () => {
  assert.equal((await runDraft(say("{}"), data, { date: "2026-10-01", session: "Evening", start: "6:55", minutes: 62 }, "g")).ok, false);
  assert.equal((await runDraft(say("{}"), data, { date: "2026-10-01", session: "Evening", start: "6:55", minutes: 60 }, "")).ok, false);
  const bad = await runDraft(say(draftJson({ blocks: [] })), data, { date: "2026-10-01", session: "Evening", start: "6:55", minutes: 60 }, "g");
  assert.ok(!bad.ok);
  const garbage = await runDraft(say("not json"), data, { date: "2026-10-01", session: "Evening", start: "6:55", minutes: 60 }, "g");
  assert.ok(!garbage.ok);
});

test("transcript: maps numbers and coaches, rejects bad dates, never saves", async () => {
  const out = JSON.stringify({ summary: "Good win.", suggestions: ["Move #7 to CB"], items: [
    { kind: "action", body: "Call Pea Ridge film", playerNumber: null, owner: "Barrett", due: "2026-10-02" },
    { kind: "note", body: "Great effort", playerNumber: 12, owner: "Jones", due: null },
    { kind: "action", body: "Bad date", playerNumber: null, owner: null, due: "Friday" },
    { kind: "note", body: "  ", playerNumber: null, owner: null, due: null },
  ] });
  const r = await runTranscript(say(out), data, "coach talking");
  assert.ok(r.ok);
  if (r.ok) {
    assert.equal(r.value.proposals.length, 2);
    assert.equal(r.value.proposals[0].note.owner, "c1");
    assert.equal(r.value.proposals[1].note.playerId, "p1");
    assert.equal(r.value.proposals[1].note.owner, null); // note, and Jones is inactive
    assert.equal(r.value.proposals[1].label, "#12 Hill");
  }
});

test("transcript: limits", async () => {
  assert.equal((await runTranscript(say("{}"), data, "")).ok, false);
  assert.equal((await runTranscript(say("{}"), data, "a".repeat(40001))).ok, false);
});

test("prompt sent to the model has no first names", async () => {
  prompts.length = 0;
  await runAsk(spy("ok"), data, "who is out?");
  assert.ok(prompts[0].includes("#12 Hill"));
  assert.ok(!prompts[0].includes("Marcus"));
});

test("errors: plain reason plus the provider's own words; 'generate' is not a rate limit", () => {
  assert.match(explain(Object.assign(new Error("Failed to generate text"), { name: "Error" })).error as string, /couldn't answer.*generate/);
  assert.match(explain(Object.assign(new Error("Free credits require a card"), { name: "GatewayRateLimitError", statusCode: 429 })).error as string, /credits or a payment method/);
  assert.match(explain(Object.assign(new Error("Model x not found"), { name: "GatewayModelNotFoundError", statusCode: 404 })).error as string, /AI_MODEL/);
  assert.match(explain(Object.assign(new Error("Invalid"), { statusCode: 401 })).error as string, /key was rejected/);
  assert.match(explain(Object.assign(new Error("x"), { name: "TimeoutError" })).error as string, /too long/);
});
