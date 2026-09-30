import assert from "node:assert/strict";
import { test } from "node:test";
import { BASE_PAGES, offlineUrls } from "../src/lib/offline";

test("offline list: main tabs, the next few days, the next games, and their scripts; nothing old or far away", () => {
  const practices = [{ id: "old", date: "2026-09-20" }, { id: "today", date: "2026-09-30" }, { id: "fri", date: "2026-10-02" }, { id: "far", date: "2026-10-20" }];
  const games = ([{ id: "g0", date: "2026-09-25", status: "final" }, { id: "g1", date: "2026-10-02", status: "scheduled" }, { id: "gx", date: "2026-10-03", status: "cancelled" }, { id: "g2", date: "2026-10-09", status: "scheduled" }]) as never;
  const scripts = [
    { id: "s1", practiceId: "today", gameId: null, updated: "2026-09-01T00:00:00Z" },
    { id: "s2", practiceId: null, gameId: "g1", updated: "2026-09-02T00:00:00Z" },
    { id: "s3", practiceId: "old", gameId: null, updated: "2026-08-01T00:00:00Z" },
    { id: "s4", practiceId: null, gameId: null, updated: "2026-09-29T00:00:00Z" },
  ];
  const urls = offlineUrls("2026-09-30", practices, games, scripts);
  for (const b of BASE_PAGES) assert.ok(urls.includes(b));
  assert.ok(urls.includes("/practice/today") && urls.includes("/practice/fri"));
  assert.ok(!urls.includes("/practice/old") && !urls.includes("/practice/far"));
  assert.ok(urls.includes("/games/g1") && urls.includes("/games/g2") && !urls.includes("/games/g0") && !urls.includes("/games/gx"));
  assert.ok(urls.includes("/scripts/s1?view=sideline") && urls.includes("/scripts/s2") && urls.includes("/scripts/s4")); // linked scripts and the most recent ones
  assert.ok(!urls.includes("/scripts/s3"));
  assert.equal(new Set(urls).size, urls.length);
  assert.ok(urls.length <= 30);
});
