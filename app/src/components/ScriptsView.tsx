"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { createScript } from "@/app/scripts/actions";
import type { Script } from "@/lib/scripts";
import { prettyDate } from "@/lib/time";
import { ListToolbar } from "./ListToolbar";
import { PageHeader } from "./PageHeader";
import { btnPlain, btnPrimary, inputCls } from "./ui";

type Choice = { id: string; label: string };
type Filters = { q: string; link: "all" | "practice" | "game" | "none" };
const NONE: Filters = { q: "", link: "all" };

/** All scripts, with the same search, filter, sort and add-at-the-top pattern as every other list. */
export function ScriptsView({ scripts, practices, games, initial }: { scripts: Script[]; practices: Choice[]; games: Choice[]; initial: { add: boolean; practiceId?: string; gameId?: string } }) {
  const router = useRouter();
  const [filters, setFilters] = useState<Filters>(NONE);
  const [sort, setSort] = useState<"recent" | "name">("recent");
  const [adding, setAdding] = useState(initial.add);
  const [name, setName] = useState("");
  const [practiceId, setPracticeId] = useState(initial.practiceId ?? "");
  const [gameId, setGameId] = useState(initial.gameId ?? "");
  const [copyFrom, setCopyFrom] = useState("");
  const [error, setError] = useState("");
  const [pending, start] = useTransition();

  const q = filters.q.trim().toLowerCase();
  const label = (s: Script) => [practices.find((p) => p.id === s.practiceId)?.label, games.find((g) => g.id === s.gameId)?.label].filter(Boolean).join(" · ");
  const list = scripts
    .filter((s) => filters.link === "all" || (filters.link === "practice" ? !!s.practiceId : filters.link === "game" ? !!s.gameId : !s.practiceId && !s.gameId))
    .filter((s) => !q || `${s.name} ${label(s)}`.toLowerCase().includes(q))
    .sort((a, b) => (sort === "name" ? a.name.localeCompare(b.name) : b.updated.localeCompare(a.updated)));

  const create = () => start(async () => {
    const r = await createScript({ name, practiceId, gameId, copyFrom });
    if (r.error || !r.id) setError(r.error || "Could not create the script."); else router.push(`/scripts/${r.id}`);
  });

  return (
    <div className="space-y-4">
      <PageHeader title={`Scripts · ${scripts.length}`} subtitle="Plays by situation, ready for practice and game day">
        <button className={btnPrimary} onClick={() => setAdding(!adding)}>{adding ? "Close" : "Add script"}</button>
      </PageHeader>

      {adding && (
        <section className="space-y-3 rounded-xl bg-white p-4 shadow-sm">
          <h2>Add a script</h2>
          <label className="block text-sm font-medium">Name<input className={inputCls} value={name} onChange={(e) => setName(e.target.value)} maxLength={80} placeholder="Thursday install, Opening script vs. Pea Ridge" autoFocus /></label>
          <div className="grid gap-3 sm:grid-cols-3">
            <label className="text-sm font-medium">For a practice (optional)<select className={inputCls} value={practiceId} onChange={(e) => setPracticeId(e.target.value)}><option value="">None</option>{practices.map((p) => <option key={p.id} value={p.id}>{p.label}</option>)}</select></label>
            <label className="text-sm font-medium">For a game (optional)<select className={inputCls} value={gameId} onChange={(e) => setGameId(e.target.value)}><option value="">None</option>{games.map((g) => <option key={g.id} value={g.id}>{g.label}</option>)}</select></label>
            <label className="text-sm font-medium">Start from (optional)<select className={inputCls} value={copyFrom} onChange={(e) => setCopyFrom(e.target.value)}><option value="">A blank script</option>{scripts.map((s) => <option key={s.id} value={s.id}>{s.name} · {s.rows.length} plays</option>)}</select></label>
          </div>
          <div className="flex items-center gap-2">
            <p role="alert" className="min-w-0 flex-1 text-sm text-red-700">{error}</p>
            <button className={btnPlain} onClick={() => setAdding(false)}>Cancel</button>
            <button className={btnPrimary} disabled={pending || !name.trim()} onClick={create}>{pending ? "Creating…" : "Create"}</button>
          </div>
        </section>
      )}

      <ListToolbar
        search={filters.q} onSearch={(v) => setFilters((f) => ({ ...f, q: v }))} placeholder="Find a script"
        sort={{ value: sort, options: [{ value: "recent", label: "Recently changed" }, { value: "name", label: "Name A–Z" }], onChange: (v) => setSort(v as "recent" | "name") }}
        filters={[{ label: "Linked to", value: filters.link, onChange: (v) => setFilters((f) => ({ ...f, link: v as Filters["link"] })), options: [{ value: "all", label: "All" }, { value: "practice", label: "A practice" }, { value: "game", label: "A game" }, { value: "none", label: "Nothing" }] }]}
        summary={`Showing ${list.length} of ${scripts.length}`} canReset={JSON.stringify(filters) !== JSON.stringify(NONE)} onReset={() => setFilters(NONE)}
      />

      {scripts.length === 0 ? (
        <p className="rounded-xl bg-white p-4 text-neutral-600 shadow-sm">No scripts yet. Add one for the next practice or your opening script.</p>
      ) : (
        <ul className="overflow-hidden rounded-xl bg-white shadow-sm">
          {list.map((s) => (
            <li key={s.id} className="border-b border-neutral-200 last:border-0">
              <Link href={`/scripts/${s.id}`} className="flex min-h-16 items-center gap-3 px-4 py-2 hover:bg-wash">
                <span className="min-w-0 flex-1"><span className="font-display block text-xl font-semibold uppercase tracking-wide">{s.name}</span><span className="block text-sm text-neutral-600">{s.rows.length} plays{label(s) ? ` · ${label(s)}` : ""} · {prettyDate(s.updated.slice(0, 10))}</span></span>
                <span aria-hidden className="text-neutral-400">›</span>
              </Link>
            </li>
          ))}
          {list.length === 0 && <li className="p-4 text-sm text-neutral-600">No scripts match those filters.</li>}
        </ul>
      )}
    </div>
  );
}
