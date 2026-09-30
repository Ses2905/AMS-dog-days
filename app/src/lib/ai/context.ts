import { CHECKLIST, prepProgress, vsLabel } from "../games";
import { openActions } from "../notes";
import { statusOn } from "../availability";
import { startTimes } from "../practice-edit";
import { addMinutes, prettyDate } from "../time";
import type { Coach, Doc, Game, Note } from "../db-types";
import type { Player, Practice } from "../types";

export type Source = { label: string; href: string };
export type AssistantData = { today: string; players: Player[]; practices: Practice[]; games: Game[]; notes: Note[]; coaches: Coach[]; docs: Doc[] };

/** Players are only ever referred to by jersey number and last name. First names, contact details and status reasons never go in. */
export const playerRef = (p: Pick<Player, "number" | "last">) => `#${p.number} ${p.last}`;

const clip = (s: string, n: number) => (s.length > n ? `${s.slice(0, n - 1)}…` : s);
const oneLine = (s: string) => s.replace(/\s+/g, " ").trim();

export function practiceLines(p: Practice): string[] {
  const starts = startTimes(p.blocks[0]?.start ?? "12:00", p.blocks);
  return p.blocks.map((b, i) => {
    const range = `${starts[i]}-${addMinutes(starts[i], b.periods * 5)}`;
    const what = b.span ?? Object.entries(b.lanes ?? {}).map(([coach, text]) => `${coach}: ${text}`).join("; ");
    return `${range} ${what}`;
  });
}

type Section = { title: string; items: string[] };

/**
 * Everything the assistant is allowed to know, as plain text with a source tag on each item ([P:…] practice,
 * [G:…] game, [N:…] note). Sections are listed most important first; when the text is too long the least important
 * items at the end are dropped so it always fits.
 */
export function buildContext(data: AssistantData, budget: number): { text: string; sources: Record<string, Source> } {
  const { today, players, practices, games, notes, coaches, docs } = data;
  const sources: Record<string, Source> = {};
  const nameOf = (list: { id: string }[]) => (id: string | null) => (id ? list.find((x) => x.id === id) : undefined);
  const playerById = nameOf(players) as (id: string | null) => Player | undefined;
  const gameById = nameOf(games) as (id: string | null) => Game | undefined;
  const coachById = nameOf(coaches) as (id: string | null) => Coach | undefined;

  const sections: Section[] = [];
  sections.push({ title: "TODAY", items: [`${prettyDate(today)} (${today}). Times are Central.`] });

  const notAvail = players.filter((p) => statusOn(p, today) !== "available");
  sections.push({
    title: "PLAYER AVAILABILITY TODAY",
    items: notAvail.length === 0 ? ["Everyone on the roster is available."] : notAvail.map((p) => `${playerRef(p)}: ${statusOn(p, today)}${p.statusUntil ? ` through ${p.statusUntil}` : ""}`),
  });

  const upcoming = [...games].filter((g) => g.date >= today).sort((a, b) => a.date.localeCompare(b.date)).slice(0, 5);
  const recent = [...games].filter((g) => g.date < today).sort((a, b) => b.date.localeCompare(a.date)).slice(0, 3);
  sections.push({
    title: "GAMES",
    items: [...upcoming, ...recent].map((g) => {
      sources[`G:${g.id}`] = { label: `${vsLabel(g)} · ${prettyDate(g.date)}`, href: `/games/${g.id}` };
      const p = prepProgress(g.checklist);
      const todo = CHECKLIST.filter((c) => !g.checklist[c.key]).map((c) => c.label);
      const result = g.status === "final" && g.scoreUs !== null ? `, final ${g.scoreUs}-${g.scoreThem}` : g.status !== "scheduled" ? `, ${g.status}` : "";
      const links = g.links.map((l) => l.label).join(", ");
      return `[G:${g.id}] ${vsLabel(g)}, ${g.date}${g.time ? ` ${g.time}` : ""}${g.location ? ` at ${g.location}` : ""}${result}. Prep ${p.done}/${p.total}${todo.length ? `; still to do: ${todo.join(", ")}` : ""}${links ? `; film/links on file: ${links}` : ""}`;
    }),
  });

  const open = openActions(notes, today);
  const noteItem = (n: Note) => {
    sources[`N:${n.id}`] = { label: clip(oneLine(n.body), 50), href: "/notes" };
    const pl = playerById(n.playerId), g = gameById(n.gameId), owner = coachById(n.owner);
    const bits = [n.kind === "action" ? `action item (${n.status})` : "note", n.created.slice(0, 10), pl && `about ${playerRef(pl)}`, g && `about ${vsLabel(g)}`, owner && `owner ${owner.last}`, n.due && `due ${n.due}`].filter(Boolean);
    return `[N:${n.id}] ${bits.join(", ")}: ${clip(oneLine(n.body), 300)}`;
  };
  sections.push({ title: "OPEN ACTION ITEMS", items: open.length ? open.map(noteItem) : ["None open."] });

  const byDate = [...practices].sort((a, b) => b.date.localeCompare(a.date) || b.id.localeCompare(a.id));
  const near = byDate.filter((p) => p.date >= today).reverse(); // today and upcoming, soonest first
  const past = byDate.filter((p) => p.date < today);
  const practiceItem = (p: Practice) => {
    sources[`P:${p.id}`] = { label: `${prettyDate(p.date)} · ${p.session}`, href: `/practice/${p.id}` };
    const head = `[P:${p.id}] ${p.date} ${p.session}, dress ${p.dress || "not set"}${p.lift ? `, lift ${p.lift}` : ""}${p.opponent ? `, opponent ${p.opponent}` : ""}`;
    return `${head}\n${practiceLines(p).map((l) => `  ${l}`).join("\n")}${p.notes.length ? `\n  Notes: ${p.notes.map(oneLine).join(" | ")}` : ""}`;
  };
  sections.push({ title: "PRACTICES (today and upcoming, then most recent)", items: [...near.slice(0, 6), ...past.slice(0, 6)].map(practiceItem) });

  const recentNotes = [...notes].filter((n) => !open.includes(n)).sort((a, b) => b.created.localeCompare(a.created)).slice(0, 30);
  sections.push({ title: "RECENT NOTES AND FINISHED ACTION ITEMS", items: recentNotes.map(noteItem) });

  sections.push({ title: "COACHES", items: coaches.filter((c) => c.active).map((c) => `${c.last} (${c.role})`) });
  sections.push({ title: "ROSTER", items: [players.map((p) => `${playerRef(p)} (${p.grade}th)`).join(", ")] });
  if (docs.length) sections.push({ title: "DOCUMENTS IN THE LIBRARY (names only; contents are not available yet)", items: docs.map((d) => `${d.name} [${d.category}]`) });

  // Drop items from the end of the least important sections until it fits.
  const render = () => sections.filter((s) => s.items.length).map((s) => `## ${s.title}\n${s.items.join("\n")}`).join("\n\n");
  let text = render();
  for (const title of ["DOCUMENTS IN THE LIBRARY (names only; contents are not available yet)", "RECENT NOTES AND FINISHED ACTION ITEMS", "PRACTICES (today and upcoming, then most recent)", "GAMES"]) {
    const s = sections.find((x) => x.title === title);
    while (s && text.length > budget && s.items.length > 1) { s.items.pop(); text = render(); }
  }
  if (text.length > budget) text = `${text.slice(0, budget - 1)}…`;
  return { text, sources };
}

const CITE = /\[(P|G|N):([^\]\s]+)\]/g;

/** Turns the [P:…] tags in an answer into a short list of links, and removes the tags from the text shown. */
export function extractCitations(answer: string, sources: Record<string, Source>): { text: string; cited: Source[] } {
  const cited: Source[] = [];
  for (const m of answer.matchAll(CITE)) {
    const s = sources[`${m[1]}:${m[2]}`];
    if (s && !cited.some((c) => c.href === s.href && c.label === s.label)) cited.push(s);
  }
  const text = answer.replace(CITE, "").replace(/[ \t]+([.,;:!?])/g, "$1").replace(/[ \t]{2,}/g, " ").replace(/\n{3,}/g, "\n\n").trim();
  return { text, cited };
}
