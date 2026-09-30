import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PracticeGrid, PracticeMeta } from "@/components/PracticeGrid";
import { PrintButton } from "@/components/PrintButton";
import { getPractice, practices } from "@/data/practices";
import { prettyDate } from "@/lib/time";

export function generateStaticParams() {
  return practices.map((p) => ({ id: p.id }));
}

export default async function PrintPage({ params }: PageProps<"/practice/[id]/print">) {
  const { id } = await params;
  const practice = getPractice(id);
  if (!practice) notFound();
  return (
    <div className="space-y-3">
      <div className="no-print flex items-center gap-3">
        <Link href={`/practice/${practice.id}`} className="text-green-600 underline">Back</Link>
        <PrintButton />
        <span className="text-sm text-neutral-500">Landscape, letter. Choose “Save as PDF” to share.</span>
      </div>
      <article className="print-sheet rounded-xl bg-white p-6 shadow-sm">
        <header className="mb-2 flex items-center gap-3 border-b-2 border-green-900 pb-2">
          <Image src="/brand/airedale-head-color.png" alt="" width={44} height={44} />
          <div>
            <h1 className="text-lg font-bold leading-tight text-green-900">{practice.team}</h1>
            <p className="text-sm">{prettyDate(practice.date)} · {practice.session} Practice</p>
          </div>
        </header>
        <PracticeMeta practice={practice} compact />
        <div className="mt-2"><PracticeGrid practice={practice} compact /></div>
        {practice.notes.length > 0 && (
          <footer className="mt-2 text-[10px] leading-snug">
            <p className="font-semibold uppercase tracking-wide text-green-900">Notes</p>
            <ul className="list-disc pl-4">{practice.notes.map((n) => <li key={n}>{n}</li>)}</ul>
          </footer>
        )}
      </article>
    </div>
  );
}
