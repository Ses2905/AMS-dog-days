"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { deleteScript, saveScript, setRowRan } from "@/app/scripts/actions";
import { blankRow, duplicateRow, groupBySection, moveRow, rowSummary, SECTIONS, situation, type Script, type ScriptRow } from "@/lib/scripts";
import { PageHeader } from "./PageHeader";
import { btnDanger, btnOutline, btnPlain, btnPrimary, inputCls } from "./ui";

type Choice = { id: string; label: string };
const SECTION_COLOR: Record<string, string> = { "Opening Script": "bg-gold-500 text-green-900", "Third Down": "bg-green-900 text-white", "Red Zone": "bg-red-700 text-white", "Goal Line": "bg-red-700 text-white", "Two Minute": "bg-blue-800 text-white", "Four Minute": "bg-blue-800 text-white" };
const chip = (section: string) => SECTION_COLOR[section] ?? "bg-neutral-200 text-neutral-800";

function Field({ label, value, onChange, max, placeholder }: { label: string; value: string; onChange: (v: string) => void; max: number; placeholder?: string }) {
  return <label className="text-sm font-medium">{label}<input className={inputCls} value={value} maxLength={max} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} /></label>;
}

function RowEditor({ row, set }: { row: ScriptRow; set: (patch: Partial<ScriptRow>) => void }) {
  return (
    <div className="grid gap-3 sm:grid-cols-3">
      <label className="text-sm font-medium">Section<select className={inputCls} value={row.section} onChange={(e) => set({ section: e.target.value })}><option value="">None</option>{SECTIONS.map((s) => <option key={s}>{s}</option>)}</select></label>
      <label className="text-sm font-medium">Down<select className={inputCls} value={row.down ?? ""} onChange={(e) => set({ down: e.target.value ? Number(e.target.value) : null })}><option value="">Any</option>{[1, 2, 3, 4].map((d) => <option key={d} value={d}>{d}</option>)}</select></label>
      <Field label="Distance" value={row.distance} onChange={(v) => set({ distance: v })} max={20} placeholder="6, 1-3, Long" />
      <label className="text-sm font-medium">Hash<select className={inputCls} value={row.hash} onChange={(e) => set({ hash: e.target.value as ScriptRow["hash"] })}><option value="">Any</option><option value="L">Left</option><option value="M">Middle</option><option value="R">Right</option></select></label>
      <Field label="Personnel" value={row.personnel} onChange={(v) => set({ personnel: v })} max={40} placeholder="11, 21, 12" />
      <Field label="Formation" value={row.formation} onChange={(v) => set({ formation: v })} max={60} placeholder="Trips Right" />
      <Field label="Motion" value={row.motion} onChange={(v) => set({ motion: v })} max={60} />
      <div className="sm:col-span-2"><Field label="Play" value={row.play} onChange={(v) => set({ play: v })} max={120} placeholder="Zone Read Left" /></div>
      <Field label="Defense / scout look" value={row.defense} onChange={(v) => set({ defense: v })} max={60} placeholder="Cover 3" />
      <div className="sm:col-span-3"><Field label="Emphasis / notes" value={row.notes} onChange={(v) => set({ notes: v })} max={300} /></div>
    </div>
  );
}

export function ScriptEditor({ script, practices, games }: { script: Script; practices: Choice[]; games: Choice[] }) {
  const router = useRouter();
  const [name, setName] = useState(script.name);
  const [practiceId, setPracticeId] = useState(script.practiceId ?? "");
  const [gameId, setGameId] = useState(script.gameId ?? "");
  const [rows, setRows] = useState<ScriptRow[]>(script.rows);
  const [open, setOpen] = useState<number | null>(null);
  const [filter, setFilter] = useState("all");
  const [dirty, setDirty] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  const [pending, start] = useTransition();

  const edit = (next: ScriptRow[]) => { setRows(next); setDirty(true); setSaved(false); };
  const setRow = (i: number, patch: Partial<ScriptRow>) => edit(rows.map((r, j) => (j === i ? { ...r, ...patch } : r)));
  const sections = [...new Set(rows.map((r) => r.section || "No section"))];
  const groups = groupBySection(rows).map((g) => ({ ...g, items: g.items })).filter((g) => filter === "all" || g.section === filter);

  const save = () => start(async () => {
    const r = await saveScript(script.id, { name, rows, practiceId, gameId });
    if (r.error) setError(r.error); else { setError(""); setDirty(false); setSaved(true); router.refresh(); }
  });
  const remove = () => { if (window.confirm(`Delete “${script.name}”? This can't be undone.`)) start(async () => { const r = await deleteScript(script.id); if (r.error) setError(r.error); else router.push("/scripts"); }); };
  const add = () => { const section = rows.at(-1)?.section ?? ""; edit([...rows, blankRow(section)]); setOpen(rows.length); setFilter("all"); };

  return (
    <div className="space-y-4 pb-24">
      <PageHeader title={name || "Script"} subtitle={`${rows.length} plays`}>
        <Link href="/scripts" className={btnOutline}>All scripts</Link>
        <Link href={`/scripts/${script.id}?view=sideline`} className={btnOutline}>Sideline view</Link>
        <Link href={`/scripts/${script.id}/print`} className={btnPrimary}>Print / PDF</Link>
      </PageHeader>

      <section className="grid gap-3 rounded-xl bg-white p-4 shadow-sm sm:grid-cols-3">
        <label className="text-sm font-medium sm:col-span-3">Name<input className={inputCls} value={name} maxLength={80} onChange={(e) => { setName(e.target.value); setDirty(true); }} /></label>
        <label className="text-sm font-medium">For a practice<select className={inputCls} value={practiceId} onChange={(e) => { setPracticeId(e.target.value); setDirty(true); }}><option value="">None</option>{practices.map((p) => <option key={p.id} value={p.id}>{p.label}</option>)}</select></label>
        <label className="text-sm font-medium">For a game<select className={inputCls} value={gameId} onChange={(e) => { setGameId(e.target.value); setDirty(true); }}><option value="">None</option>{games.map((g) => <option key={g.id} value={g.id}>{g.label}</option>)}</select></label>
      </section>

      {sections.length > 1 && (
        <div className="flex flex-wrap gap-2" role="group" aria-label="Filter by section">
          {["all", ...sections].map((s) => <button key={s} aria-pressed={filter === s} onClick={() => setFilter(s)} className={`min-h-10 rounded-full px-4 text-sm font-semibold ${filter === s ? "bg-green-900 text-white" : "border border-neutral-300 bg-white"}`}>{s === "all" ? "All" : s}</button>)}
        </div>
      )}

      {rows.length === 0 && <p className="rounded-xl bg-white p-4 text-neutral-600 shadow-sm">No plays yet. Add the first one.</p>}
      {groups.map((g) => (
        <section key={g.section} className="overflow-hidden rounded-xl bg-white shadow-sm">
          <h2 className="flex items-center gap-2 border-b border-neutral-200 px-4 py-2 text-lg"><span className={`rounded-full px-3 py-0.5 text-sm font-semibold ${chip(g.section)}`}>{g.section}</span><span className="text-sm font-normal text-neutral-600">{g.items.length}</span></h2>
          <ul>
            {g.items.map(({ row, index }) => (
              <li key={index} className="border-b border-neutral-200 last:border-0">
                <button className="flex min-h-14 w-full items-center gap-3 px-4 py-2 text-left" aria-expanded={open === index} onClick={() => setOpen(open === index ? null : index)}>
                  <span className="font-display w-8 shrink-0 text-xl font-semibold text-neutral-500">{index + 1}</span>
                  <span className="min-w-0 flex-1"><span className="block truncate font-medium">{rowSummary(row)}</span>{(row.personnel || row.defense || row.hash) && <span className="block truncate text-xs text-neutral-600">{[row.personnel && `Pers ${row.personnel}`, row.hash && `Hash ${row.hash}`, row.defense && `vs ${row.defense}`].filter(Boolean).join(" · ")}</span>}</span>
                </button>
                {open === index && (
                  <div className="space-y-3 bg-wash px-4 py-3">
                    <RowEditor row={row} set={(patch) => setRow(index, patch)} />
                    <div className="flex flex-wrap gap-2">
                      <button className={btnPlain} onClick={() => edit(moveRow(rows, index, -1))} disabled={index === 0}>Move up</button>
                      <button className={btnPlain} onClick={() => edit(moveRow(rows, index, 1))} disabled={index === rows.length - 1}>Move down</button>
                      <button className={btnPlain} onClick={() => { edit(duplicateRow(rows, index)); setOpen(index + 1); }}>Duplicate</button>
                      <button className={`${btnDanger} ml-auto`} onClick={() => { edit(rows.filter((_, j) => j !== index)); setOpen(null); }}>Delete</button>
                    </div>
                  </div>
                )}
              </li>
            ))}
          </ul>
        </section>
      ))}

      <button className={btnOutline} onClick={add}>Add play</button>

      <div className="fixed inset-x-0 bottom-0 z-10 border-t border-neutral-300 bg-white/95 px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3 backdrop-blur no-print">
        <div className="mx-auto flex max-w-6xl items-center gap-3">
          <p role="alert" className="min-w-0 flex-1 truncate text-sm text-red-700">{error || (saved ? "" : dirty ? "Unsaved changes" : "")}</p>
          {saved && !error && <span className="text-sm font-semibold text-green-900">Saved</span>}
          <button className={btnDanger} disabled={pending} onClick={remove}>Delete script</button>
          <button className={btnPrimary} disabled={pending || !dirty} onClick={save}>{pending ? "Saving…" : "Save"}</button>
        </div>
      </div>
    </div>
  );
}

/** Big, read-only cards for the sideline. Tap the circle when a play has been run. */
export function ScriptSideline({ script }: { script: Script }) {
  const [ran, setRan] = useState(script.rows.map((r) => r.ran));
  const [error, setError] = useState("");
  const [, start] = useTransition();
  const toggle = (i: number) => {
    const next = !ran[i];
    setRan((cur) => cur.map((v, j) => (j === i ? next : v)));
    start(async () => { const r = await setRowRan(script.id, i, next); if (r.error) { setError(r.error); setRan((cur) => cur.map((v, j) => (j === i ? !next : v))); } else setError(""); });
  };
  const groups = groupBySection(script.rows);
  return (
    <div className="space-y-4">
      <PageHeader title={script.name} subtitle={`${ran.filter(Boolean).length} of ${script.rows.length} run`}>
        <Link href={`/scripts/${script.id}`} className={btnOutline}>Back to editing</Link>
      </PageHeader>
      {error && <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-800">{error}</p>}
      {groups.map((g) => (
        <section key={g.section} className="space-y-2">
          <h2 className="flex items-center gap-2"><span className={`rounded-full px-3 py-0.5 text-sm font-semibold ${chip(g.section)}`}>{g.section}</span></h2>
          <ul className="space-y-2">
            {g.items.map(({ row, index }) => (
              <li key={index}>
                <button onClick={() => toggle(index)} aria-pressed={ran[index]} className={`flex min-h-20 w-full items-center gap-4 rounded-xl p-4 text-left shadow-sm ${ran[index] ? "bg-neutral-200 text-neutral-500" : "bg-white"}`}>
                  <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 text-lg font-bold ${ran[index] ? "border-green-900 bg-green-900 text-white" : "border-neutral-400"}`}>{ran[index] ? "✓" : ""}</span>
                  <span className="min-w-0 flex-1">
                    <span className="font-display block text-2xl font-semibold uppercase leading-tight tracking-wide">{index + 1}. {row.play || row.formation}</span>
                    <span className="block text-base">{[situation(row), row.formation && row.play ? row.formation : "", row.motion && `Motion ${row.motion}`, row.personnel && `Pers ${row.personnel}`, row.hash && `Hash ${row.hash}`].filter(Boolean).join(" · ")}</span>
                    {(row.defense || row.notes) && <span className="block text-sm text-neutral-600">{[row.defense && `vs ${row.defense}`, row.notes].filter(Boolean).join(" · ")}</span>}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
