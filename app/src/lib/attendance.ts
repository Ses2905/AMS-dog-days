import { statusOn } from "./availability";
import type { Player } from "./types";

export const MARKS = ["present", "late", "absent", "excused"] as const;
export type Mark = (typeof MARKS)[number];
export const MARK_LABEL: Record<Mark, string> = { present: "Present", late: "Late", absent: "Absent", excused: "Excused" };
export const isMark = (v: unknown): v is Mark => typeof v === "string" && (MARKS as readonly string[]).includes(v);

export type AttendanceRow = { practiceId: string; playerId: string; mark: Mark };

/** Counts for one practice. Late still counts as there. */
export function tally(marks: Mark[], rosterSize: number) {
  const n = (m: Mark) => marks.filter((x) => x === m).length;
  const there = n("present") + n("late");
  return { marked: marks.length, unmarked: Math.max(0, rosterSize - marks.length), present: n("present"), late: n("late"), absent: n("absent"), excused: n("excused"), there };
}

/** Who "Everyone present" should mark: players nobody has marked yet who aren't listed out or excused on that date. */
export function bulkPresentTargets(players: Pick<Player, "id" | "status" | "statusUntil">[], marked: Set<string>, date: string): string[] {
  return players.filter((p) => !marked.has(p.id) && ["available", "limited"].includes(statusOn(p, date))).map((p) => p.id);
}

/** A player's season so far. Excused days don't count against him. */
export function playerSummary(rows: { mark: Mark; date: string }[]) {
  const counted = rows.filter((r) => r.mark !== "excused");
  const there = counted.filter((r) => r.mark === "present" || r.mark === "late").length;
  return {
    total: rows.length,
    counted: counted.length,
    there,
    late: rows.filter((r) => r.mark === "late").length,
    absent: rows.filter((r) => r.mark === "absent").length,
    excused: rows.length - counted.length,
    pct: counted.length ? Math.round((there / counted.length) * 100) : null,
  };
}
