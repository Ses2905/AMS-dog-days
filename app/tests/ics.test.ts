import assert from "node:assert/strict";
import { test } from "node:test";
import { buildIcs, fold, gameMinutes, type Feed } from "../src/lib/ics";

const feed: Feed = {
  games: [
    { id: "g1", date: "2026-10-02", time: "7:00 PM", opponent: "Farmington, AR", site: "home", location: "Alma; Airedale Stadium", level: "varsity", status: "scheduled" },
    { id: "g2", date: "2026-10-03", time: null, opponent: "Pea Ridge", site: "away", location: null, level: "jr", status: "scheduled" },
    { id: "g3", date: "2026-10-04", time: "5:30 PM", opponent: "Cancelled Team", site: "home", location: null, level: "jr", status: "cancelled" },
  ],
  practices: [
    { id: "2026-10-01-evening", date: "2026-10-01", session: "Evening", dress: "Helmets", opponent: null, start: "6:55", periods: 18 },
    { id: "2026-10-01-school-day", date: "2026-10-01", session: "School Day", dress: null, opponent: null, start: null, periods: 0 },
  ],
};

test("game times and folding", () => {
  assert.equal(gameMinutes("7:00 PM"), 19 * 60);
  assert.equal(gameMinutes("12:30 PM"), 12 * 60 + 30);
  assert.equal(gameMinutes("12:00 AM"), 0);
  assert.equal(gameMinutes(null), null);
  const long = "DESCRIPTION:" + "é".repeat(80);
  const folded = fold(long).split("\r\n");
  assert.ok(folded.length > 1 && folded.every((l, i) => new TextEncoder().encode(i ? l.slice(1) : l).length <= 75));
  assert.equal(folded.map((l, i) => (i ? l.slice(1) : l)).join(""), long);
});

test("calendar file has the right events, escapes text and skips what has no time", () => {
  const ics = buildIcs(feed, new Date("2026-09-30T12:00:00Z"));
  assert.ok(ics.startsWith("BEGIN:VCALENDAR\r\n") && ics.endsWith("END:VCALENDAR\r\n"));
  assert.equal((ics.match(/BEGIN:VEVENT/g) ?? []).length, 3); // varsity game, all-day away game, one planned practice
  assert.ok(ics.includes("SUMMARY:Varsity: vs Farmington\\, AR"));
  assert.ok(ics.includes("LOCATION:Alma\; Airedale Stadium"));
  assert.ok(ics.includes("DTSTART;TZID=America/Chicago:20261002T190000"));
  assert.ok(ics.includes("DTEND;TZID=America/Chicago:20261002T213000"));
  assert.ok(ics.includes("DTSTART;VALUE=DATE:20261003") && ics.includes("DTEND;VALUE=DATE:20261004"));
  assert.ok(ics.includes("SUMMARY:7th / Jr. High: @ Pea Ridge") || ics.includes("@ Pea Ridge"));
  assert.ok(ics.includes("DTSTART;TZID=America/Chicago:20261001T185500") && ics.includes("DTEND;TZID=America/Chicago:20261001T202500"));
  assert.ok(!ics.includes("Cancelled Team") && !ics.includes("School Day"));
  assert.ok(ics.includes("UID:game-g1@coach-os") && ics.includes("UID:practice-2026-10-01-evening@coach-os"));
  assert.ok(!/[^\r]\n/.test(ics)); // every line break is CRLF
});
