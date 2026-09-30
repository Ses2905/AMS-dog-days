import Image from "next/image";
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
    <div className="space-y-6">
      <PageHeader title="Tools" subtitle="The apps you open most, one tap away" />
      {links.length === 0 ? (
        <p className="rounded-2xl bg-white p-5 text-base text-neutral-700 shadow-sm">No tools yet. Add one below.</p>
      ) : (
        <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {links.map((l, i) => {
            const b = toolBrand(l.label, l.url);
            return (
              <li key={`${l.url}-${i}`}>
                <a href={l.url} target="_blank" rel="noopener noreferrer" className="flex h-full min-h-32 flex-col items-center justify-center gap-3 rounded-2xl bg-white p-4 text-center shadow-sm transition-shadow hover:shadow-md">
                  <span aria-hidden className="font-display flex h-14 w-14 items-center justify-center rounded-2xl text-3xl font-bold" style={{ background: b.bg, color: b.fg }}>
                    {b.logo ? <Image src={b.logo} alt="" width={36} height={36} unoptimized className="h-9 w-9 object-contain" /> : b.glyph ? <svg viewBox="0 0 24 24" width="30" height="30" fill="currentColor"><path d={b.glyph} /></svg> : b.mark}
                  </span>
                  <span className="text-base font-semibold leading-tight">{l.label}</span>
                </a>
              </li>
            );
          })}
        </ul>
      )}
      <LinksEditor initial={links} save={saveToolLinks} title="Edit Tools" hint="Add or remove any app" empty="Nothing here yet." />
    </div>
  );
}
