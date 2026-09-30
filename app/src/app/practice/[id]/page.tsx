import Link from "next/link";
import { notFound } from "next/navigation";
import { PracticeGrid, PracticeMeta } from "@/components/PracticeGrid";
import { AvailabilitySummary } from "@/components/AvailabilitySummary";
import { getPlayers, getPractice } from "@/lib/db";
import { prettyDate } from "@/lib/time";

export default async function PracticePage({ params }: PageProps<"/practice/[id]">) {
  const { id } = await params;
  const practice = await getPractice(id);
  if (!practice) notFound();
  const players = await getPlayers();
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <div>
          <h1 className="text-2xl font-semibold">{prettyDate(practice.date)} · {practice.session}</h1>
          <p className="text-sm text-neutral-600">{practice.team}</p>
        </div>
        <div className="ml-auto flex gap-2">
          <Link href={`/practice/${practice.id}/edit`} className="inline-flex min-h-12 items-center rounded-lg border border-green-900 px-5 font-semibold text-green-900">
            Edit
          </Link>
          <Link href={`/practice/new?from=${practice.id}`} className="inline-flex min-h-12 items-center rounded-lg border border-green-900 px-5 font-semibold text-green-900">
            Copy to a new day
          </Link>
          <Link href={`/practice/${practice.id}/print`} className="inline-flex min-h-12 items-center rounded-lg bg-green-900 px-5 font-semibold text-white">
            Print / PDF
          </Link>
        </div>
      </div>
      {practice.imported && (
        <p className="rounded-lg border border-gold-500 bg-[#f8f4e3] px-3 py-2 text-sm">
          Imported from your PDF. Merged rows and notes may need a quick check against the original.
        </p>
      )}
      <PracticeMeta practice={practice} />
      <AvailabilitySummary players={players} date={practice.date} />
      <div className="overflow-x-auto rounded-xl bg-white shadow-sm">
        <div className="min-w-[640px]"><PracticeGrid practice={practice} /></div>
      </div>
      {practice.notes.length > 0 && (
        <section className="rounded-xl bg-white p-4 shadow-sm">
          <h2 className="mb-2 font-semibold">Notes</h2>
          <ul className="list-disc space-y-1 pl-5 text-sm">{practice.notes.map((n) => <li key={n}>{n}</li>)}</ul>
        </section>
      )}
    </div>
  );
}
