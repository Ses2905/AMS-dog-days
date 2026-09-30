import type { DepthPosition, DepthSlot } from "./depth";
import type { Script, ScriptRow } from "./scripts";
import type { Play } from "./plays";
import type { DocText } from "./db-types";
import type { AttendanceRow } from "./attendance";
import { createClient } from "@/lib/supabase/server";
import type { Coach, Doc, Game, GameLink, Note } from "@/lib/db-types";
import type { Block, Player, Practice } from "@/lib/types";

type BlockRow = { position: number; start_time: string; periods: number; span: string | null; flex: boolean; lanes: Record<string, string> };
type PracticeRow = {
  id: string; date: string; session: string; team: string; opponent: string | null; dress: string | null; lift: string | null;
  od_meeting: string | null; situations: string | null; imported: boolean; coaches: string[]; notes: string[];
  practice_blocks: BlockRow[];
};

const toPractice = (r: PracticeRow): Practice => ({
  id: r.id,
  date: r.date,
  session: r.session,
  team: r.team,
  imported: r.imported,
  opponent: r.opponent ?? undefined,
  dress: r.dress ?? "",
  lift: r.lift ?? undefined,
  odMeeting: r.od_meeting ?? undefined,
  situations: r.situations ?? undefined,
  coaches: r.coaches,
  notes: r.notes,
  blocks: [...r.practice_blocks]
    .sort((a, b) => a.position - b.position)
    .map((b): Block => ({ start: b.start_time, periods: b.periods, span: b.span ?? undefined, flex: b.flex || undefined, lanes: b.lanes })),
});

export async function getPractices(): Promise<Practice[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("practices").select("*, practice_blocks(*)").order("date").order("id");
  if (error) throw new Error(`Could not load practices: ${error.message}`);
  return (data as PracticeRow[]).map(toPractice);
}

export async function getPractice(id: string): Promise<Practice | undefined> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("practices").select("*, practice_blocks(*)").eq("id", id).maybeSingle();
  if (error) throw new Error(`Could not load practice: ${error.message}`);
  return data ? toPractice(data as PracticeRow) : undefined;
}

const toPlayer = (p: Record<string, unknown>): Player => ({
  id: p.id as string, first: p.first_name as string, last: p.last_name as string, grade: p.grade as number, number: p.number as number,
  team: (p.team as Player["team"]) ?? "jr", position: (p.position as string | null) ?? undefined, height: (p.height as string | null) ?? undefined, weight: (p.weight as number | null) ?? undefined,
  otherNumbers: p.other_numbers as number[], status: p.status as Player["status"], statusNote: (p.status_note as string | null) ?? undefined, statusUntil: (p.status_until as string | null) ?? undefined,
});

async function loadPlayers(team?: Player["team"]): Promise<Player[]> {
  const supabase = await createClient();
  const q = supabase.from("players").select("*").order("number");
  const { data, error } = await (team ? q.eq("team", team) : q);
  if (error) throw new Error(`Could not load players: ${error.message}`);
  return data.map(toPlayer);
}
/** Jordan's Jr. High roster. Attendance, the depth chart, availability and the assistant all work from this list. */
export const getPlayers = () => loadPlayers("jr");
/** The high school roster (varsity and JV), used for scorers and its own roster page. */
export const getHighSchoolPlayers = () => loadPlayers("hs");
export const getAllPlayers = () => loadPlayers();


export async function getCoaches(): Promise<Coach[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("coaches").select("*").order("sort");
  if (error) throw new Error(`Could not load coaches: ${error.message}`);
  return data.map((c) => ({ id: c.id, first: c.first_name, last: c.last_name, role: c.role, active: c.active }));
}

export async function getNotes(): Promise<Note[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("notes").select("*").order("created_at", { ascending: false });
  if (error) throw new Error(`Could not load notes: ${error.message}`);
  return data.map((n) => ({
    id: n.id, kind: n.kind, body: n.body, status: n.status, due: n.due_date, owner: n.owner,
    category: n.category ?? null, playerId: n.player_id, practiceId: n.practice_id, gameId: n.game_id, source: n.source, created: n.created_at,
  }));
}

const toGame = (g: Record<string, unknown>): Game => ({
  id: g.id as string, date: g.date as string, time: (g.start_time as string | null) ?? null, level: (g.level as Game["level"]) ?? "jr", opponent: g.opponent as string,
  site: g.site as Game["site"], location: (g.location as string | null) ?? null, kind: g.kind as Game["kind"], status: g.status as Game["status"],
  scoreUs: (g.score_us as number | null) ?? null, scoreThem: (g.score_them as number | null) ?? null,
  links: (g.links as Game["links"]) ?? [], checklist: (g.checklist as Game["checklist"]) ?? {},
});

export async function getGames(): Promise<Game[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("games").select("*").order("date");
  if (error) throw new Error(`Could not load games: ${error.message}`);
  return data.map(toGame);
}

export async function getGame(id: string): Promise<Game | undefined> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("games").select("*").eq("id", id).maybeSingle();
  if (error) throw new Error(`Could not load the game: ${error.message}`);
  return data ? toGame(data) : undefined;
}

export async function getDocuments(): Promise<Doc[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("documents").select("id,name,category,mime,size_bytes,game_id,practice_id,created_at,text_chars").order("created_at", { ascending: false });
  if (error) throw new Error(`Could not load documents: ${error.message}`);
  return data.map((d) => ({ id: d.id, name: d.name, category: d.category, mime: d.mime, size: d.size_bytes, gameId: d.game_id, practiceId: d.practice_id, created: d.created_at, textChars: d.text_chars }));
}

/** The text of every document the assistant may read (playbooks, scouting, practice), for finding passages. */
export async function getDocumentTexts(): Promise<DocText[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("documents").select("id,name,category,game_id,text_content").in("category", ["playbook", "scouting", "practice"]).gt("text_chars", 0);
  if (error) throw new Error(`Could not load document text: ${error.message}`);
  return data.map((d) => ({ id: d.id, name: d.name, category: d.category, gameId: d.game_id, text: d.text_content ?? "" }));
}

async function getLinkSetting(key: string, what: string): Promise<GameLink[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("settings").select("value").eq("key", key).maybeSingle();
  if (error) throw new Error(`Could not load the ${what}: ${error.message}`);
  return ((data?.value as GameLink[] | undefined) ?? []).filter((l) => l && typeof l.url === "string");
}
export const getScheduleLinks = () => getLinkSetting("schedule_links", "schedule links");
export const getToolLinks = () => getLinkSetting("tool_links", "tools");

export async function getAttendance(): Promise<AttendanceRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("attendance").select("practice_id,player_id,status");
  if (error) throw new Error(`Could not load attendance: ${error.message}`);
  return data.map((r) => ({ practiceId: r.practice_id, playerId: r.player_id, mark: r.status }));
}

export async function getPlays(gameId?: string): Promise<Play[]> {
  const supabase = await createClient();
  const q = supabase.from("game_plays").select("*").order("quarter").order("created_at");
  const { data, error } = await (gameId ? q.eq("game_id", gameId) : q);
  if (error) throw new Error(`Could not load scoring plays: ${error.message}`);
  return data.map((r) => ({ id: r.id, gameId: r.game_id, quarter: r.quarter, team: r.team, type: r.type, points: r.points, playerId: r.player_id, scorerName: r.scorer_name, detail: r.detail }));
}

const toScriptRow = (r: Record<string, unknown>): ScriptRow => ({
  section: r.section as string, down: (r.down as number | null) ?? null, distance: r.distance as string, hash: r.hash as ScriptRow["hash"],
  personnel: r.personnel as string, formation: r.formation as string, motion: r.motion as string, play: r.play as string,
  defense: r.defense as string, notes: r.notes as string, ran: r.ran === true,
});

export async function getScripts(): Promise<Script[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("scripts").select("*, script_rows(*)").order("updated_at", { ascending: false });
  if (error) throw new Error(`Could not load scripts: ${error.message}`);
  return data.map((s) => ({
    id: s.id, name: s.name, practiceId: s.practice_id, gameId: s.game_id, updated: s.updated_at,
    rows: (s.script_rows as { position: number }[]).sort((a, b) => a.position - b.position).map((r) => toScriptRow(r)),
  }));
}

export async function getScript(id: string): Promise<Script | null> {
  if (!/^[0-9a-f-]{36}$/i.test(id)) return null;
  const supabase = await createClient();
  const { data, error } = await supabase.from("scripts").select("*, script_rows(*)").eq("id", id).maybeSingle();
  if (error) throw new Error(`Could not load the script: ${error.message}`);
  if (!data) return null;
  return {
    id: data.id, name: data.name, practiceId: data.practice_id, gameId: data.game_id, updated: data.updated_at,
    rows: (data.script_rows as { position: number }[]).sort((a, b) => a.position - b.position).map((r) => toScriptRow(r)),
  };
}

export type SavedOutput = { id: string; workflow: string; title: string; body: string; gameId: string | null; playerId: string | null; created: string };
export async function getSavedOutputs(): Promise<SavedOutput[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("saved_outputs").select("*").order("created_at", { ascending: false }).limit(50);
  if (error) throw new Error(`Could not load saved results: ${error.message}`);
  return data.map((r) => ({ id: r.id, workflow: r.workflow, title: r.title, body: r.body, gameId: r.game_id, playerId: r.player_id, created: r.created_at }));
}

export async function getDepthChart(): Promise<{ positions: DepthPosition[]; slots: DepthSlot[] }> {
  const supabase = await createClient();
  const [pos, slots] = await Promise.all([supabase.from("depth_positions").select("*").order("sort"), supabase.from("depth_slots").select("*")]);
  if (pos.error) throw new Error(`Could not load the depth chart: ${pos.error.message}`);
  if (slots.error) throw new Error(`Could not load the depth chart: ${slots.error.message}`);
  return {
    positions: pos.data.map((p) => ({ id: p.id, unit: p.unit, name: p.name, starters: p.starters, sort: p.sort })),
    slots: slots.data.map((s) => ({ positionId: s.position_id, playerId: s.player_id, rank: s.rank })),
  };
}
