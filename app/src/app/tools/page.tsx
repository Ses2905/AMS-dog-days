import { connection } from "next/server";
import { LinksEditor } from "@/components/LinksEditor";
import { PageHeader } from "@/components/PageHeader";
import { getToolLinks } from "@/lib/db";
import { toolBrand } from "@/lib/tools";
import { saveToolLinks } from "./actions";

export default async function ToolsPage() {
  await connection();
  const links = await getToolLinks();
  return (
    <div className="space-y-4">
      <PageHeader title="Tools" subtitle="Everything Jordan opens all the time, one tap away" />
      {links.length === 0 ? (
        <p className="text-neutral-600">No tools yet. Add one below.</p>
      ) : (
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {links.map((l, i) => {
            const b = toolBrand(l.label, l.url);
            return (
              <li key={`${l.url}-${i}`}>
                <a href={l.url} target="_blank" rel="noopener noreferrer" className="flex min-h-28 flex-col items-center justify-center gap-2 rounded-xl bg-white p-4 text-center shadow-sm hover:shadow-md">
                  <span aria-hidden className="font-display flex h-14 w-14 items-center justify-center rounded-2xl text-3xl font-bold" style={{ background: b.bg, color: b.fg }}>{b.mark}</span>
                  <span className="font-display text-lg font-semibold uppercase tracking-wide">{l.label}</span>
                </a>
              </li>
            );
          })}
        </ul>
      )}
      <LinksEditor initial={links} save={saveToolLinks} title="Edit Tools" hint="Add or remove anything" empty="Nothing here yet." />
    </div>
  );
}
