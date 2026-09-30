import Image from "next/image";
import Link from "next/link";
import { connection } from "next/server";
import { notFound } from "next/navigation";
import { PrintButton } from "@/components/PrintButton";
import { getScript } from "@/lib/db";
import { situation } from "@/lib/scripts";

export default async function ScriptPrint({ params }: PageProps<"/scripts/[id]/print">) {
  await connection();
  const { id } = await params;
  const script = await getScript(id);
  if (!script) notFound();
  return (
    <div className="space-y-3">
      <div className="no-print flex items-center gap-3">
        <Link href={`/scripts/${script.id}`} className="text-green-600 underline">Back</Link>
        <PrintButton />
        <span className="text-sm text-neutral-500">Landscape, letter. Choose “Save as PDF” to share.</span>
      </div>
      <article className="print-sheet rounded-xl bg-white p-6 shadow-sm">
        <header className="mb-2 flex items-center gap-3 border-b-2 border-green-900 pb-2">
          <Image src="/brand/airedale-head-color.png" alt="" width={44} height={44} />
          <div><h1 className="text-lg font-bold leading-tight text-green-900">{script.name}</h1><p className="text-sm">{script.rows.length} plays</p></div>
        </header>
        <table className="w-full border-collapse text-[11px] leading-tight">
          <thead><tr className="bg-green-900 text-white [print-color-adjust:exact] [-webkit-print-color-adjust:exact]">
            {["#", "Section", "Sit.", "Hash", "Pers.", "Formation", "Motion", "Play", "Defense", "Notes"].map((h) => <th key={h} className="px-1.5 py-1 text-left font-semibold uppercase tracking-wide">{h}</th>)}
          </tr></thead>
          <tbody>
            {script.rows.map((r, i) => (
              <tr key={i} className="border-b border-neutral-300 [break-inside:avoid]">
                <td className="px-1.5 py-1 font-semibold">{i + 1}</td><td className="px-1.5 py-1">{r.section}</td><td className="px-1.5 py-1 whitespace-nowrap">{situation(r)}</td><td className="px-1.5 py-1">{r.hash}</td>
                <td className="px-1.5 py-1">{r.personnel}</td><td className="px-1.5 py-1">{r.formation}</td><td className="px-1.5 py-1">{r.motion}</td><td className="px-1.5 py-1 font-semibold">{r.play}</td><td className="px-1.5 py-1">{r.defense}</td><td className="px-1.5 py-1">{r.notes}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </article>
    </div>
  );
}
