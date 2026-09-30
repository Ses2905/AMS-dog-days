import assert from "node:assert/strict";
import { test } from "node:test";
import { chunkText, extractText, isReadableCategory, redact, tidy, topChunks } from "../src/lib/doc-text";
import { docContext, extractCitations } from "../src/lib/ai/context";

const enc = (s: string) => new TextEncoder().encode(s);

test("redact removes phone numbers and emails, keeps football", () => {
  const r = redact("Call Coach at (479) 555-0134 or 479-555-0199, mail coach@almasd.net. 3rd & 6 vs Cover 3, 2-1-1.");
  assert.ok(!r.includes("555") && !r.includes("@") && r.includes("3rd & 6") && r.includes("2-1-1"));
});

test("extract text from plain files, and say why when it can't", async () => {
  const ok = await extractText(enc("Base defense is 4-3 over.\r\n\r\n\r\nBlitz on third and long from the field side."), "txt");
  assert.ok(ok.ok && ok.text.includes("4-3 over") && !ok.text.includes("\r") && !/\n{3}/.test(ok.text));
  const empty = await extractText(enc("  \n "), "md");
  assert.ok(!empty.ok && empty.reason === "empty");
  const bad = await extractText(enc("x"), "xlsx");
  assert.ok(!bad.ok && bad.reason === "unsupported");
  const notPdf = await extractText(enc("this is not a pdf"), "pdf");
  assert.ok(!notPdf.ok && notPdf.reason === "failed");
  const long = await extractText(enc("word ".repeat(60_000)), "txt");
  assert.ok(long.ok && long.truncated && long.text.length <= 150_000);
});

test("chunks stay near the size limit and keep order", () => {
  const text = Array.from({ length: 12 }, (_, i) => `Paragraph ${i}. ${"filler ".repeat(40)}`).join("\n\n");
  const chunks = chunkText("d1", "Playbook", text, 600);
  assert.ok(chunks.length > 3 && chunks.every((c) => c.text.length <= 700));
  assert.deepEqual(chunks.map((c) => c.n), chunks.map((_, i) => i + 1));
  const huge = chunkText("d2", "Big", "x".repeat(5000), 1000);
  assert.ok(huge.length === 5);
});

test("the best passages win, rare words count more, budget is respected", () => {
  const docs = [
    { docId: "a", docName: "Pea Ridge Scout", n: 1, text: "Pea Ridge runs power from 21 personnel. Cover 3 on early downs." },
    { docId: "a", docName: "Pea Ridge Scout", n: 2, text: "Special teams: they squib kick after touchdowns." },
    { docId: "b", docName: "Our Playbook", n: 1, text: "Our screen package: slip screen, tunnel screen, bubble screen from trips." },
  ];
  const top = topChunks("What coverage does Pea Ridge run on early downs?", docs, 2, 500);
  assert.equal(top[0].docId, "a");
  assert.equal(top[0].n, 1);
  assert.deepEqual(topChunks("zzzz qqqq", docs, 3, 500), []);
  assert.equal(topChunks("screen", docs, 3, 30).length, 0); // nothing fits the budget
});

test("document context tags passages, links the file, redacts, and citations resolve", () => {
  const ctx = docContext("blitz on third down", [{ id: "d9", name: "Defense Playbook", category: "playbook", gameId: null, text: "Blitz on third down when they show empty. Call 555-123-4567 to change it." }]);
  assert.ok(ctx.text.includes("[D:d9:1]") && ctx.text.includes("untrusted") && !ctx.text.includes("555-123"));
  const cited = extractCitations("Send the fire zone on third down [D:d9:1].", ctx.sources);
  assert.equal(cited.cited[0].href, "/documents/d9/file");
  assert.equal(docContext("anything", undefined).text, "");
});

test("only playbook, scouting and practice documents are readable by the assistant", () => {
  assert.ok(isReadableCategory("scouting") && isReadableCategory("playbook") && isReadableCategory("practice"));
  assert.ok(!isReadableCategory("school") && !isReadableCategory("other"));
  assert.equal(tidy("a  b\n\n\n\nc  \n"), "a b\n\nc");
});

import { MockLanguageModelV4 } from "ai/test";
import { runAsk } from "../src/lib/ai/run";

test("ask: passages from documents reach the model and come back as source links", async () => {
  let sent = "";
  const usage = { inputTokens: { total: 1, noCache: 1, cacheRead: undefined, cacheWrite: undefined }, outputTokens: { total: 1, text: 1, reasoning: undefined } };
  const model = new MockLanguageModelV4({ doGenerate: async (o) => { sent = JSON.stringify(o.prompt); return { content: [{ type: "text", text: "They play Cover 3 [D:d1:1]." }], finishReason: { unified: "stop", raw: undefined }, usage, warnings: [] }; } });
  const data = { today: "2026-09-30", players: [], practices: [], games: [], notes: [], coaches: [], docs: [], docTexts: [{ id: "d1", name: "Pea Ridge Scout", category: "scouting" as const, gameId: null, text: "Pea Ridge plays Cover 3 on early downs." }] };
  const r = await runAsk(model, data as never, "What coverage does Pea Ridge play?");
  assert.ok(sent.includes("Cover 3 on early downs") && sent.includes("[D:d1:1]"));
  assert.ok(r.ok && r.value.sources[0].href === "/documents/d1/file" && !r.value.answer.includes("[D:"));
});
