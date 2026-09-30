import Link from "next/link";
import { notFound } from "next/navigation";
import { PracticeGrid, PracticeMeta } from "@/components/PracticeGrid";
import { AvailabilitySummary } from "@/components/AvailabilitySummary";
import { PageHeader } from "@/components/PageHeader";
import { btnOutline, btnPrimary } from "@/components/ui";
import { AttendancePanel } from "@/components/AttendancePanel";
import type { Mark } from "@/lib/attendance";
import { getAttendance, getDocuments, getNotes, getPlayers, getPractice, getScripts } from "@/lib/db";
import { prettyDate } from "@/lib/time";
import { Icon } from "@/components/Icon";
import { Pill } from "@/components/Pill";

export default async function PracticePage({ params }: PageProps<"/practice/[id]">) {
  const { id } = await params;
  const practice = await getPractice(id);
  if (!practice) notFound();
  const [players, allNotes, allDocs, attendance, allScripts] = await Promise.all([getPlayers(), getNotes(), getDocuments(), getAttendance(), getScripts()]);
  const scripts = allScripts.filter((s) => s.practiceId === practice.id);
  const marks: Record<string, Mark> = Object.fromEntries(attendance.filter((a) => a.practiceId === practice.id).map((a) => [a.playerId, a.mark]));
  const docs = allDocs.filter((d) => d.practiceId === practice.id);
  const notes = allNotes.filter((n) => n.practiceId === practice.id);
  return (
    <div className="space-y-4">
      <PageHeader title={`${prettyDate(practice.date)} · ${practice.session}`} subtitle={practice.team}>
        <Link href={`/practice/new?from=${practice.id}`} className={btnOutline}><Icon name="copy" />Copy to a New Day</Link>
        <Link href={`/practice/${practice.id}/edit`} className={btnOutline}><Icon name="pencil" />Edit</Link>
        <Link href={`/practice/${practice.id}/print`} className={btnPrimary}><Icon name="printer" />Print / PDF</Link>
      </PageHeader>
      {practice.imported && (
        <p className="rounded-lg border border-gold-500 bg-[#f8f4e3] px-3 py-2 text-sm">
          Imported from your PDF. Merged rows and notes may need a quick check against the original.
        </p>
      )}
      <PracticeMeta practice={practice} />
      <AvailabilitySummary players={players} date={practice.date} />
      <div className="overflow-x-auto rounded-2xl bg-white shadow-sm">
        <div className="min-w-[640px]"><PracticeGrid practice={practice} /></div>
      </div>
      <section className="space-y-3 rounded-2xl bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-center gap-2">
          <h2>Scripts{scripts.length > 0 ? ` · ${scripts.length}` : ""}</h2>
          <Link href={`/scripts?add=1&practice=${practice.id}`} className={btnOutline + " ml-auto"}><Icon name="plus" />Add Script</Link>
        </div>
        {scripts.length === 0 ? <p className="text-sm text-neutral-600">Plan the plays you will run in team periods and open them on the field.</p> : (
          <ul className="divide-y divide-neutral-200">{scripts.map((s) => <li key={s.id}><Link href={`/scripts/${s.id}`} className="flex min-h-12 items-center justify-between gap-2 font-medium text-green-600 underline"><span className="truncate">{s.name}</span><span className="text-sm font-normal text-neutral-600">{s.rows.length} plays</span></Link></li>)}</ul>
        )}
      </section>
      <AttendancePanel practiceId={practice.id} date={practice.date} players={players} initial={marks} />
      {practice.notes.length > 0 && (
        <section className="rounded-2xl bg-white p-5 shadow-sm">
          <h2 className="mb-2 font-semibold">Notes</h2>
          <ul className="list-disc space-y-1 pl-5 text-sm">{practice.notes.map((n) => <li key={n}>{n}</li>)}</ul>
        </section>
      )}
      <section className="space-y-3 rounded-2xl bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-center gap-2">
          <h2>Documents{docs.length > 0 ? ` · ${docs.length}` : ""}</h2>
          <Link href={`/documents?add=1&practice=${practice.id}`} className={btnOutline + " ml-auto"}><Icon name="plus" />Add Document</Link>
        </div>
        {docs.length === 0 ? (
          <p className="text-sm text-neutral-600">Drill diagrams, install sheets or a printed plan you want to keep with this practice.</p>
        ) : (
          <ul className="divide-y divide-neutral-200">
            {docs.map((d) => (
              <li key={d.id}><a href={`/documents/${d.id}/file`} target="_blank" rel="noopener noreferrer" className="flex min-h-12 items-center gap-2 font-medium text-green-600 underline"><span className="truncate">{d.name}</span><Icon name="external" size={14} /></a></li>
            ))}
          </ul>
        )}
      </section>

      <section className="space-y-3 rounded-2xl bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-center gap-2">
          <h2>Notes from This Practice{notes.length > 0 ? ` · ${notes.length}` : ""}</h2>
          <div className="ml-auto flex gap-2">
            <Link href={`/notes?add=1&kind=action&practice=${practice.id}`} className={btnOutline}><Icon name="plus" />Add Action Item</Link>
            <Link href={`/notes?add=1&kind=note&practice=${practice.id}`} className={btnPrimary}><Icon name="plus" />Add Note</Link>
          </div>
        </div>
        {notes.length === 0 ? (
          <p className="text-sm text-neutral-600">Nothing yet. Jot down what you want to remember once practice is over.</p>
        ) : (
          <ul className="space-y-2">
            {notes.map((n) => (
              <li key={n.id} className="text-sm">
                <Pill tone={n.kind === "action" ? "gold" : "grey"} className="mr-2">{n.kind === "action" ? (n.status === "done" ? "Done" : "Action") : "Note"}</Pill>
                <span className={`whitespace-pre-wrap ${n.status === "done" ? "text-neutral-500 line-through" : ""}`}>{n.body}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
