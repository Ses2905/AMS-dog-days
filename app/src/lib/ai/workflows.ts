import { categoryLabel } from "../notes";
import { playerSummary } from "../attendance";
import { statusOn } from "../availability";
import { levelLabel, vsLabel } from "../games";
import { leaders, playLabel, quarterLabel, totals } from "../plays";
import { prettyDate } from "../time";
import { analyze } from "../depth";
import { buildContext, playerRef, practiceLines, type AssistantData } from "./context";
import { SKILL_TEXT } from "./skills";

export type Subject = "none" | "game" | "player" | "practice";
export type Workflow = {
  id: string; skill: string; title: string; blurb: string; subject: Subject; subjectHint: string;
  inputLabel: string; placeholder: string; kind: "document" | "script";
  /** "schedule" keeps player names and notes out entirely (used for messages that go to families). */
  scope: "full" | "schedule";
};

export const WORKFLOWS: Workflow[] = [
  { id: "week", skill: "coach-chief-of-staff", title: "Plan My Week", blurb: "One coordinated plan across practice, scouting, scripts, players and staff.", subject: "none", subjectHint: "", inputLabel: "Anything the week has to work around?", placeholder: "Short Tuesday, two guys limited, want the screen installed by Thursday", kind: "document", scope: "full" },
  { id: "scout", skill: "opponent-scout", title: "Scout an Opponent", blurb: "Turns your scouting notes into tendencies and what to do about them.", subject: "game", subjectHint: "Which game?", inputLabel: "Paste scouting notes, stats or film observations", placeholder: "Runs power 70% from 21 personnel. Cover 3 on early downs. Blitz on 3rd and long…", kind: "document", scope: "full" },
  { id: "gameplan", skill: "game-plan-builder", title: "Build a Game Plan", blurb: "A small, executable plan by situation from your scouting and personnel.", subject: "game", subjectHint: "Which game?", inputLabel: "What matters most this week?", placeholder: "Establish the run, protect the QB, one new screen", kind: "document", scope: "full" },
  { id: "script", skill: "script-builder", title: "Build a Script", blurb: "A numbered script you can save straight into Scripts and edit.", subject: "game", subjectHint: "For which game? (optional)", inputLabel: "Which situations, how many plays, and your play list", placeholder: "Opening script, 12 plays. Plays: Zone Read, Power, Bootleg, Screen, Dive…", kind: "script", scope: "full" },
  { id: "briefing", skill: "staff-briefing", title: "Staff Briefing", blurb: "A common brief plus what each coach owns.", subject: "game", subjectHint: "For which game? (optional)", inputLabel: "What is the staff meeting about?", placeholder: "Tuesday staff meeting, plan for Pea Ridge week", kind: "document", scope: "full" },
  { id: "gameday", skill: "game-day-command-center", title: "Game Day Packet", blurb: "Timeline, responsibilities, alerts and sideline checklist on one page.", subject: "game", subjectHint: "Which game?", inputLabel: "Anything specific for game day?", placeholder: "Bus leaves at 3:15, two coaches at the JV game first", kind: "document", scope: "full" },
  { id: "postgame", skill: "postgame-review", title: "Postgame Review", blurb: "What worked, what didn't, and no more than five priorities for next week.", subject: "game", subjectHint: "Which game?", inputLabel: "Your notes or the Plaud transcript", placeholder: "Paste what you remember, or the recording transcript", kind: "document", scope: "full" },
  { id: "player", skill: "player-development", title: "Player Development Plan", blurb: "One to three priorities, drills and cues for a player.", subject: "player", subjectHint: "Which player?", inputLabel: "What have you seen?", placeholder: "Great effort, keeps dropping his eyes on the block, needs a better first step", kind: "document", scope: "full" },
  { id: "depth", skill: "roster-depth-chart-manager", title: "Depth Chart Check", blurb: "Thin spots, missing backups and who is out, from your depth chart and position notes.", subject: "none", subjectHint: "", inputLabel: "Anything to focus on?", placeholder: "Who could back up at center? Any position we're short on?", kind: "document", scope: "full" },
  { id: "comms", skill: "parent-player-comms", title: "Message to Families", blurb: "A clear announcement drafted from the facts you give. No player details.", subject: "game", subjectHint: "About which game? (optional)", inputLabel: "What do families need to know?", placeholder: "Bus times, what to wear, senior night reminder", kind: "document", scope: "schedule" },
];

export const workflowById = (id: string) => WORKFLOWS.find((w) => w.id === id);

const oneLine = (s: string) => s.replace(/\s+/g, " ").trim();
const clip = (s: string, n: number) => (s.length > n ? `${s.slice(0, n - 1)}…` : s);

/** Extra, focused facts about the chosen game, player or practice. Players are only ever number and last name; parent notes never appear. */
export function focusContext(kind: Subject, id: string, data: AssistantData): string {
  const notes = data.notes.filter((n) => n.category !== "parent");
  const ref = (pid: string | null) => { const p = [...data.players, ...(data.hsPlayers ?? [])].find((x) => x.id === pid); return p ? playerRef(p) : ""; };
  if (kind === "game") {
    const g = data.games.find((x) => x.id === id);
    if (!g) return "";
    const plays = (data.plays ?? []).filter((p) => p.gameId === g.id);
    const t = totals(plays);
    const lines = [
      `GAME: ${levelLabel(g.level)} ${vsLabel(g)}, ${prettyDate(g.date)}${g.time ? ` ${g.time}` : ""}${g.location ? ` (${g.location})` : ""}. Status ${g.status}${g.status === "final" && g.scoreUs !== null ? `, final ${g.scoreUs}-${g.scoreThem}` : ""}.`,
      ...(plays.length ? [`Scoring log (${t.us}-${t.them}): ${plays.map((p) => `${quarterLabel(p.quarter)} ${p.team === "us" ? "Alma" : g.opponent} ${playLabel(p.type)}${ref(p.playerId) ? ` ${ref(p.playerId)}` : p.scorerName ? ` ${p.scorerName}` : ""}${p.detail ? ` (${clip(oneLine(p.detail), 80)})` : ""}`).join("; ")}`] : []),
      ...notes.filter((n) => n.gameId === g.id).map((n) => `Note about this game (${n.created.slice(0, 10)}): ${clip(oneLine(n.body), 400)}`),
      ...data.docs.filter((d) => d.gameId === g.id).map((d) => `Document on file: ${d.name} (${d.category}); contents not available.`),
      ...(data.scripts ?? []).filter((s) => s.gameId === g.id).map((s) => `Script on file: ${s.name}, ${s.rows.length} plays (${[...new Set(s.rows.map((r) => r.section).filter(Boolean))].join(", ") || "no sections"}).`),
    ];
    return lines.join("\n");
  }
  if (kind === "player") {
    const p = data.players.find((x) => x.id === id);
    if (!p) return "";
    const rows = (data.attendance ?? []).filter((a) => a.playerId === p.id).flatMap((a) => { const pr = data.practices.find((x) => x.id === a.practiceId); return pr ? [{ mark: a.mark, date: pr.date }] : []; });
    const a = playerSummary(rows);
    const mine = leaders((data.plays ?? []).filter((x) => x.playerId === p.id), () => playerRef(p))[0];
    return [
      `PLAYER: ${playerRef(p)}, ${p.grade}th grade. Availability today: ${statusOn(p, data.today)}.`,
      a.total ? `Attendance: ${a.pct ?? "n/a"}% (${a.there} of ${a.counted} counted practices; ${a.late} late, ${a.absent} absent, ${a.excused} excused).` : "Attendance: none recorded yet.",
      mine ? `Scoring this season: ${mine.touchdowns} TD, ${mine.fieldGoals} FG, ${mine.conversions} conversions, ${mine.points} points.` : "",
      ...notes.filter((n) => n.playerId === p.id).map((n) => `${n.category ? categoryLabel(n.category) : "Note"} (${n.created.slice(0, 10)}): ${clip(oneLine(n.body), 400)}`),
    ].filter(Boolean).join("\n");
  }
  if (kind === "practice") {
    const p = data.practices.find((x) => x.id === id);
    if (!p) return "";
    return [`PRACTICE: ${p.date} ${p.session}, dress ${p.dress || "not set"}`, ...practiceLines(p), ...notes.filter((n) => n.practiceId === p.id).map((n) => `Note: ${clip(oneLine(n.body), 300)}`)].join("\n");
  }
  return "";
}

/** The depth chart as the coach has entered it, plus position-idea notes for players who are not placed. */
export function positionIdeas(data: AssistantData): string {
  const lines = data.notes.filter((n) => n.category === "position" && n.playerId).map((n) => `${playerRef(data.players.find((p) => p.id === n.playerId) ?? { number: 0, last: "?" })}: ${clip(oneLine(n.body), 200)}`);
  const chart = data.depth && data.depth.positions.length
    ? (() => {
        const { rows, unplaced } = analyze(data.depth.positions, data.depth.slots, data.players, data.today);
        return `DEPTH CHART (as entered by the coach)\n${rows.map((r) => `${r.position.name} (${r.position.starters} starting, ${r.depth}): ${r.players.map((x) => `${x.rank}. ${playerRef(x.player)}${x.unavailable ? ` [${x.unavailable}]` : ""}`).join(", ") || "nobody listed"}`).join("\n")}\nNot placed: ${unplaced.map(playerRef).join(", ") || "none"}`;
      })()
    : "";
  return [chart, lines.length ? `POSITION IDEAS FROM COACH NOTES\n${lines.join("\n")}` : ""].filter(Boolean).join("\n\n");
}

export function workflowContext(w: Workflow, subjectId: string, data: AssistantData, budget: number): string {
  if (w.scope === "schedule") {
    // Families see schedules only: no roster, no notes, no availability.
    const base = buildContext({ ...data, players: [], notes: [], practices: [], docs: [], coaches: [] }, budget).text;
    const g = data.games.find((x) => x.id === subjectId);
    return `${base}${g ? `\n\nGAME: ${levelLabel(g.level)} ${vsLabel(g)}, ${prettyDate(g.date)}${g.time ? ` ${g.time}` : ""}${g.location ? ` (${g.location})` : ""}` : ""}`;
  }
  const focus = [focusContext(w.subject, subjectId, data), w.id === "depth" ? positionIdeas(data) : ""].filter(Boolean).join("\n\n");
  const main = buildContext(data, Math.max(4000, budget - focus.length)).text;
  return focus ? `${focus}\n\n${main}` : main;
}

export const workflowSystem = (w: Workflow) => `${SKILL_TEXT[w.skill] ?? ""}

Format: short headings and tight bullets a coach can use on a phone. Bold nothing. Mark any assumption. Do not include a preamble or sign-off.`;
