import Link from "next/link";
import { notFound } from "next/navigation";
import { GameChecklist, GameHeader, GameLinks } from "@/components/GamePanels";
import { btnOutline, btnPrimary } from "@/components/ui";
import { GameScoring } from "@/components/GameScoring";
import { getDocuments, getGame, getNotes, getPlayers, getPlays, getPractices, getScripts } from "@/lib/db";
import { prettyDate } from "@/lib/time";

const addDays = (iso: string, n: number) => {
  const d = new Date(`${iso}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
};

export default async function GamePage({ params }: PageProps<"/games/[id]">) {
  const { id } = await params;
  const game = await getGame(id);
  if (!game) notFound();
  const [notes, practices, allDocs, plays, players, allScripts] = await Promise.all([getNotes(), getPractices(), getDocuments(), getPlays(game.id), getPlayers(), getScripts()]);
  const scripts = allScripts.filter((s) => s.gameId === game.id);
  const docs = allDocs.filter((d) => d.gameId === game.id);
  const about = notes.filter((n) => n.gameId === game.id);
  const week = practices.filter((p) => p.date >= addDays(game.date, -6) && p.date <= game.date).sort((a, b) => a.date.localeCompare(b.date) || a.id.localeCompare(b.id));

  return (
    <div className="space-y-4">
      <GameHeader game={game} />
      <GameScoring game={game} plays={plays} roster={[...players].sort((a, b) => a.number - b.number).map((p) => ({ id: p.id, label: `#${p.number} ${p.first} ${p.last}` }))} />
      <div className="grid gap-4 lg:grid-cols-2">
        <GameChecklist gameId={game.id} initial={game.checklist} />
        <GameLinks gameId={game.id} initial={game.links} />
      </div>

      <section className="space-y-3 rounded-xl bg-white p-4 shadow-sm">
        <div className="flex flex-wrap items-center gap-2">
          <h2>Scripts{scripts.length > 0 ? ` · ${scripts.length}` : ""}</h2>
          <Link href={`/scripts?add=1&game=${game.id}`} className={btnOutline + " ml-auto"}>Add script</Link>
        </div>
        {scripts.length === 0 ? <p className="text-sm text-neutral-600">Opening script and situational plays for this opponent.</p> : (
          <ul className="divide-y divide-neutral-200">{scripts.map((s) => <li key={s.id}><Link href={`/scripts/${s.id}`} className="flex min-h-12 items-center justify-between gap-2 font-medium text-green-600 underline"><span className="truncate">{s.name}</span><span className="text-sm font-normal text-neutral-600">{s.rows.length} plays</span></Link></li>)}</ul>
        )}
      </section>

      <section className="space-y-3 rounded-xl bg-white p-4 shadow-sm">
        <div className="flex flex-wrap items-center gap-2">
          <h2>Documents{docs.length > 0 ? ` · ${docs.length}` : ""}</h2>
          <Link href={`/documents?add=1&game=${game.id}`} className={btnOutline + " ml-auto"}>Add document</Link>
        </div>
        {docs.length === 0 ? (
          <p className="text-sm text-neutral-600">Scouting reports and playbook pages for this opponent. Upload them once and they open right from here.</p>
        ) : (
          <ul className="divide-y divide-neutral-200">
            {docs.map((d) => (
              <li key={d.id}><a href={`/documents/${d.id}/file`} target="_blank" rel="noopener noreferrer" className="flex min-h-12 items-center gap-2 font-medium text-green-600 underline"><span className="truncate">{d.name}</span><span aria-hidden className="text-xs">↗</span></a></li>
            ))}
          </ul>
        )}
      </section>

      <section className="space-y-3 rounded-xl bg-white p-4 shadow-sm">
        <div className="flex flex-wrap items-center gap-2">
          <h2>Scouting & notes{about.length > 0 ? ` · ${about.length}` : ""}</h2>
          <div className="ml-auto flex gap-2">
            <Link href={`/notes?add=1&kind=action&game=${game.id}`} className={btnOutline}>Add action item</Link>
            <Link href={`/notes?add=1&kind=note&game=${game.id}`} className={btnPrimary}>Add note</Link>
          </div>
        </div>
        {about.length === 0 ? (
          <p className="text-sm text-neutral-600">Tendencies, personnel, what to attack. Notes you add here also show up on the Notes tab.</p>
        ) : (
          <ul className="space-y-2">
            {about.map((n) => (
              <li key={n.id} className="text-sm">
                <span className={`mr-2 rounded-full px-2 py-0.5 text-xs font-semibold ${n.kind === "action" ? "bg-gold-500 text-green-900" : "bg-neutral-200 text-neutral-700"}`}>{n.kind === "action" ? (n.status === "done" ? "Done" : "Action") : "Note"}</span>
                <span className={`whitespace-pre-wrap ${n.status === "done" ? "text-neutral-500 line-through" : ""}`}>{n.body}</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="space-y-2 rounded-xl bg-white p-4 shadow-sm">
        <h2>Practices this week</h2>
        {week.length === 0 ? (
          <p className="text-sm text-neutral-600">No practices on file in the six days before this game.</p>
        ) : (
          <ul className="divide-y divide-neutral-200">
            {week.map((p) => (
              <li key={p.id}><Link href={`/practice/${p.id}`} className="flex min-h-12 items-center justify-between gap-3 hover:underline"><span className="font-medium">{prettyDate(p.date)} · {p.session}</span><span className="text-sm text-neutral-500">{p.dress}</span></Link></li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
