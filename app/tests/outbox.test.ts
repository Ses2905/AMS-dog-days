import assert from "node:assert/strict";
import { test } from "node:test";
import { addPending, dropPending, parseOutbox, withPending } from "../src/lib/outbox";

const p = (playerId: string, mark: "present" | "absent" | null, at: number, practiceId = "pr1") => ({ practiceId, playerId, mark, at });

test("the last tap per player wins", () => {
  const list = addPending(addPending([], p("a", "present", 1)), p("a", "absent", 2));
  assert.deepEqual(list, [p("a", "absent", 2)]);
  assert.equal(addPending(list, p("b", "present", 3)).length, 2);
});

test("a saved entry is dropped, but a newer tap made while sending stays", () => {
  const sent = p("a", "present", 1);
  assert.deepEqual(dropPending([sent], sent), []);
  assert.deepEqual(dropPending([p("a", "absent", 2)], sent), [p("a", "absent", 2)]);
});

test("waiting taps show on top of saved marks, including cleared ones", () => {
  const shown = withPending({ a: "present", b: "late" }, [p("a", null, 1), p("c", "absent", 2), p("z", "present", 3, "other")], "pr1");
  assert.deepEqual(shown, { b: "late", c: "absent" });
});

test("bad, old or missing storage is ignored", () => {
  const now = 10 * 24 * 60 * 60 * 1000;
  assert.deepEqual(parseOutbox(null, now), []);
  assert.deepEqual(parseOutbox("{nope", now), []);
  assert.deepEqual(parseOutbox(JSON.stringify({ a: 1 }), now), []);
  const good = p("a", "present", now - 1000), old = p("b", "present", 1), bad = { ...p("c", "present", now), mark: "asleep" };
  assert.deepEqual(parseOutbox(JSON.stringify([good, old, bad]), now), [good]);
});
