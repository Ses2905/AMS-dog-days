import { createClient } from "@/lib/supabase/server";
import type { Coach, Doc, Game, Note } from "@/lib/db-types";
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

export async function getPlayers(): Promise<Player[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("players").select("*").order("number");
  if (error) throw new Error(`Could not load players: ${error.message}`);
  return data.map((p) => ({ id: p.id, first: p.first_name, last: p.last_name, grade: p.grade, number: p.number, otherNumbers: p.other_numbers, status: p.status, statusNote: p.status_note ?? undefined, statusUntil: p.status_until ?? undefined }));
}


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
    playerId: n.player_id, practiceId: n.practice_id, gameId: n.game_id, source: n.source, created: n.created_at,
  }));
}

const toGame = (g: Record<string, unknown>): Game => ({
  id: g.id as string, date: g.date as string, time: (g.start_time as string | null) ?? null, opponent: g.opponent as string,
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
  const { data, error } = await supabase.from("documents").select("id,name,category,mime,size_bytes,game_id,practice_id,created_at").order("created_at", { ascending: false });
  if (error) throw new Error(`Could not load documents: ${error.message}`);
  return data.map((d) => ({ id: d.id, name: d.name, category: d.category, mime: d.mime, size: d.size_bytes, gameId: d.game_id, practiceId: d.practice_id, created: d.created_at }));
}
