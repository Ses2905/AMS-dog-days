import Link from "next/link";
import { practices } from "@/data/practices";
import { prettyDate } from "@/lib/time";

export default function PracticeList() {
  const sorted = [...practices].sort((a, b) => b.date.localeCompare(a.date) || a.id.localeCompare(b.id));
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Practice</h1>
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
