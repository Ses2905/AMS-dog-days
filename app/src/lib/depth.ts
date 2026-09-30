import { statusOn } from "./availability";
import type { Player } from "./types";

export const UNITS = [{ value: "offense", label: "Offense" }, { value: "defense", label: "Defense" }, { value: "special", label: "Special Teams" }] as const;
export type Unit = (typeof UNITS)[number]["value"];
export const isUnit = (v: unknown): v is Unit => UNITS.some((u) => u.value === v);
export const unitLabel = (u: Unit) => UNITS.find((x) => x.value === u)?.label ?? u;

export type DepthPosition = { id: string; unit: Unit; name: string; starters: number; sort: number };
export type DepthSlot = { positionId: string; playerId: string; rank: number };

export type Row = {
  position: DepthPosition;
  players: { player: Player; rank: number; unavailable: "out" | "excused" | "limited" | null; alsoAt: string[] }[];
  /** short = fewer players than starting spots; thin = starters covered but no full backup group. */
  depth: "short" | "thin" | "ok";
};

/** Everything the depth chart screen and the assistant need: ranked players per position, who is hurt, who plays two spots. */
export function analyze(positions: DepthPosition[], slots: DepthSlot[], players: Player[], date: string): { rows: Row[]; unplaced: Player[] } {
  const byId = new Map(players.map((p) => [p.id, p]));
  const nameOf = new Map(positions.map((p) => [p.id, p.name]));
  const rows = [...positions].sort((a, b) => a.sort - b.sort || a.name.localeCompare(b.name)).map((position): Row => {
    const mine = slots.filter((s) => s.positionId === position.id && byId.has(s.playerId)).sort((a, b) => a.rank - b.rank);
    const list = mine.map((s, i) => {
      const player = byId.get(s.playerId)!;
      const st = statusOn(player, date);
      return {
        player, rank: i + 1,
        unavailable: st === "available" ? null : st,
        alsoAt: slots.filter((o) => o.playerId === s.playerId && o.positionId !== position.id).map((o) => nameOf.get(o.positionId) ?? "").filter(Boolean),
      };
    });
    const usable = list.filter((x) => x.unavailable !== "out" && x.unavailable !== "excused").length;
    return { position, players: list, depth: usable < position.starters ? "short" : usable < position.starters * 2 ? "thin" : "ok" };
  });
  const placed = new Set(slots.map((s) => s.playerId));
  return { rows, unplaced: players.filter((p) => !placed.has(p.id)) };
}

export const DEPTH_LABEL: Record<Row["depth"], string> = { short: "Short", thin: "No full backups", ok: "Covered" };

/** New ranks (0..n-1) for one position after moving a player up or down. */
export function reorder(playerIds: string[], playerId: string, by: -1 | 1): string[] {
  const i = playerIds.indexOf(playerId), j = i + by;
  if (i < 0 || j < 0 || j >= playerIds.length) return playerIds;
  const next = [...playerIds];
  [next[i], next[j]] = [next[j], next[i]];
  return next;
}

export function parsePosition(input: unknown): { ok: true; value: { unit: Unit; name: string; starters: number } } | { ok: false; error: string } {
  if (typeof input !== "object" || input === null) return { ok: false, error: "Nothing to save." };
  const p = input as Record<string, unknown>;
  if (!isUnit(p.unit)) return { ok: false, error: "Pick offense, defense or special teams." };
  const name = typeof p.name === "string" ? p.name.trim().replace(/\s+/g, " ") : "";
  if (!name) return { ok: false, error: "Give the position a name, like WR or Nose Guard." };
  if (name.length > 30) return { ok: false, error: "Position names are 30 characters or fewer." };
  const starters = Number(p.starters);
  if (!Number.isInteger(starters) || starters < 1 || starters > 11) return { ok: false, error: "Starters should be 1 to 11." };
  return { ok: true, value: { unit: p.unit, name, starters } };
}
