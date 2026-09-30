import { statusOn } from "./availability";
import type { Coach } from "./db-types";
import type { Player, Practice } from "./types";

const text = (a: string, b: string) => a.localeCompare(b, undefined, { sensitivity: "base" });
export const norm = (s: string) => s.toLowerCase().trim();

// ---------- Team ----------
export type PlayerSort = "number" | "last" | "first" | "grade" | "status";
export type PlayerFilters = { q: string; grade: "all" | "8" | "9"; status: "all" | "not-available" | "limited" | "out" | "excused"; review: boolean };
export const NO_PLAYER_FILTERS: PlayerFilters = { q: "", grade: "all", status: "all", review: false };

const URGENCY = { out: 0, limited: 1, excused: 2, available: 3 } as const;

export function filterPlayers(players: Player[], f: PlayerFilters, today: string): Player[] {
  const q = norm(f.q);
  return players.filter((p) => {
    if (f.grade !== "all" && String(p.grade) !== f.grade) return false;
    const s = statusOn(p, today);
    if (f.status === "not-available" ? s === "available" : f.status !== "all" && s !== f.status) return false;
    if (f.review && p.otherNumbers.length === 0) return false;
    return !q || norm(`${p.first} ${p.last}`).includes(q) || String(p.number) === q;
  });
}

export function sortPlayers(players: Player[], by: PlayerSort, today: string): Player[] {
  const cmp: Record<PlayerSort, (a: Player, b: Player) => number> = {
    number: (a, b) => a.number - b.number,
    last: (a, b) => text(a.last, b.last) || text(a.first, b.first),
    first: (a, b) => text(a.first, b.first) || text(a.last, b.last),
    grade: (a, b) => a.grade - b.grade,
    status: (a, b) => URGENCY[statusOn(a, today)] - URGENCY[statusOn(b, today)],
  };
  // Ties always fall back to number so the order is stable and predictable.
  return [...players].sort((a, b) => cmp[by](a, b) || a.number - b.number);
}

// ---------- Coaches ----------
export type CoachSort = "order" | "last" | "role";
export type CoachFilters = { q: string; active: "all" | "active" | "inactive" };
export const NO_COACH_FILTERS: CoachFilters = { q: "", active: "all" };

export function filterCoaches(coaches: Coach[], f: CoachFilters): Coach[] {
  const q = norm(f.q);
  return coaches.filter((c) => {
    if (f.active === "active" && !c.active) return false;
    if (f.active === "inactive" && c.active) return false;
    return !q || norm(`${c.first ?? ""} ${c.last} ${c.role}`).includes(q);
  });
}

export function sortCoaches(coaches: Coach[], by: CoachSort): Coach[] {
  if (by === "order") return [...coaches]; // already in the saved order
  return [...coaches].sort((a, b) => (by === "last" ? text(a.last, b.last) : text(a.role, b.role) || text(a.last, b.last)));
}

// ---------- Practices ----------
export type PracticeSort = "newest" | "oldest";
export type PracticeFilters = { q: string; session: string; review: boolean };
export const NO_PRACTICE_FILTERS: PracticeFilters = { q: "", session: "all", review: false };

export function filterPractices(practices: Practice[], f: PracticeFilters): Practice[] {
  const q = norm(f.q);
  return practices.filter((p) => {
    if (f.session !== "all" && p.session !== f.session) return false;
    if (f.review && !p.imported) return false;
    return !q || norm(`${p.session} ${p.date} ${p.opponent ?? ""} ${p.dress}`).includes(q);
  });
}

export function sortPractices(practices: Practice[], by: PracticeSort): Practice[] {
  const dir = by === "newest" ? -1 : 1;
  return [...practices].sort((a, b) => dir * a.date.localeCompare(b.date) || dir * a.id.localeCompare(b.id));
}
