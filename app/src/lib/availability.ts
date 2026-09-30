import type { Player } from "./types";

export const STATUSES = ["available", "limited", "out", "excused"] as const;
export type Status = (typeof STATUSES)[number];

export const STATUS_LABEL: Record<Status, string> = { available: "Available", limited: "Limited", out: "Out", excused: "Excused" };

/** A status with an "until" date only counts through that date (inclusive); with no date it counts until changed. */
export function statusOn(p: Pick<Player, "status" | "statusUntil">, date: string): Status {
  if (p.status === "available") return "available";
  if (p.statusUntil && p.statusUntil < date) return "available";
  return p.status;
}

export function availabilityOn(players: Player[], date: string) {
  const by = (s: Status) => players.filter((p) => statusOn(p, date) === s);
  const out = by("out"), limited = by("limited"), excused = by("excused");
  return { out, limited, excused, available: players.length - out.length - limited.length - excused.length, total: players.length };
}

export type StatusUpdate = { playerId: string; status: Status; note: string | null; until: string | null };

export function parseStatusUpdate(input: unknown): { ok: true; value: StatusUpdate } | { ok: false; error: string } {
  if (typeof input !== "object" || input === null) return { ok: false, error: "Nothing to save." };
  const p = input as Record<string, unknown>;
  if (typeof p.playerId !== "string" || !p.playerId || p.playerId.length > 100) return { ok: false, error: "Unknown player." };
  if (typeof p.status !== "string" || !(STATUSES as readonly string[]).includes(p.status)) return { ok: false, error: "Pick a status." };
  const note = typeof p.note === "string" ? p.note.trim() : "";
  if (note.length > 120) return { ok: false, error: "Note is too long (max 120 characters)." };
  const untilRaw = typeof p.until === "string" ? p.until.trim() : "";
  if (untilRaw) {
    const d = new Date(`${untilRaw}T00:00:00Z`);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(untilRaw) || Number.isNaN(d.getTime()) || d.toISOString().slice(0, 10) !== untilRaw)
      return { ok: false, error: "That date doesn't look right." };
  }
  const status = p.status as Status;
  // Available clears the note and date, so old excuses don't linger.
  return { ok: true, value: { playerId: p.playerId, status, note: status === "available" ? null : note || null, until: status === "available" ? null : untilRaw || null } };
}
