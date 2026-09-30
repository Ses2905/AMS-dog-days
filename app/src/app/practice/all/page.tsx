import Link from "next/link";
import { getPractices } from "@/lib/db";
import { prettyDate } from "@/lib/time";

export default async function AllPractices() {
  const practices = await getPractices();
  const sorted = [...practices].sort((a, b) => b.date.localeCompare(a.date) || a.id.localeCompare(b.id));
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <h1 className="text-2xl font-semibold">All practices</h1>
        <Link href="/practice/new" className="ml-auto inline-flex min-h-12 items-center rounded-lg bg-green-900 px-5 font-semibold text-white">New practice</Link>
      </div>
      <ul className="divide-y divide-neutral-200 overflow-hidden rounded-xl bg-white shadow-sm">
        {sorted.map((p) => (
          <li key={p.id}>
            <Link href={`/practice/${p.id}`} className="flex min-h-14 items-center justify-between px-4 py-3 hover:bg-wash">
              <span>
                <span className="font-medium">{prettyDate(p.date)}</span>
                <span className="text-neutral-500"> · {p.session}</span>{p.imported && <span className="ml-2 rounded bg-[#f8f4e3] px-1.5 text-xs text-neutral-600">verify</span>}
              </span>
              <span className="text-sm text-neutral-500">{p.dress}</span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
