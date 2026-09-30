import { connection } from "next/server";
import { NotesView } from "@/components/NotesView";
import { getCoaches, getNotes, getPlayers, getPractices } from "@/lib/db";
import { prettyDate } from "@/lib/time";
import { nowInSchool } from "@/lib/week";

export default async function NotesPage({ searchParams }: PageProps<"/notes">) {
  await connection();
  const q = await searchParams;
  const one = (v: string | string[] | undefined) => (typeof v === "string" ? v : "");
  const [notes, players, coaches, practices] = await Promise.all([getNotes(), getPlayers(), getCoaches(), getPractices()]);
  const recent = [...practices].sort((a, b) => b.date.localeCompare(a.date) || b.id.localeCompare(a.id)).slice(0, 40);
  const show = one(q.show);
  return (
    <NotesView
      notes={notes}
      today={nowInSchool().today}
      lookups={{
        players: players.map((p) => ({ id: p.id, label: `#${p.number} ${p.first} ${p.last}` })),
        coaches: coaches.filter((c) => c.active).map((c) => ({ id: c.id, label: c.last })),
        practices: recent.map((p) => ({ id: p.id, label: `${prettyDate(p.date)} · ${p.session}` })),
      }}
      initial={{
        add: one(q.add) === "1",
        kind: one(q.kind) === "action" ? "action" : one(q.kind) === "note" ? "note" : undefined,
        practiceId: one(q.practice) || undefined,
        show: (["open", "done", "notes"] as const).find((s) => s === show),
      }}
    />
  );
}
