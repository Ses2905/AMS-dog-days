"use client";

import { useRef, useState, useTransition } from "react";
import { deleteDocument, finishUpload, prepareUpload, readDocument, updateDocument } from "@/app/documents/actions";
import type { Doc } from "@/lib/db-types";
import { canReadMime, isReadableCategory } from "@/lib/doc-text";
import { ACCEPT, CATEGORIES, TYPES, displayName, extensionOf, formatSize, kindOf, type Category } from "@/lib/documents";
import { prettyDate } from "@/lib/time";
import { createClient } from "@/lib/supabase/client";
import { ListToolbar } from "./ListToolbar";
import { PageHeader } from "./PageHeader";
import { btnDanger, btnPlain, btnPrimary, inputCls } from "./ui";
import { Icon } from "./Icon";
import { Pill } from "./Pill";

type Choice = { id: string; label: string };
type Lookups = { games: Choice[]; practices: Choice[] };
type Initial = { add: boolean; gameId?: string; practiceId?: string; category?: Category };

function Uploader({ lookups, initial, onDone }: { lookups: Lookups; initial: Initial; onDone: () => void }) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [name, setName] = useState("");
  const [category, setCategory] = useState<Category>(initial.category ?? (initial.gameId ? "scouting" : initial.practiceId ? "practice" : "playbook"));
  const [gameId, setGameId] = useState(initial.gameId ?? "");
  const [practiceId, setPracticeId] = useState(initial.practiceId ?? "");
  const [stage, setStage] = useState("");
  const [error, setError] = useState("");
  const busy = stage !== "";

  const pick = (f: File | null) => { setFile(f); setName(f ? displayName(f.name) : ""); setError(""); };

  const upload = async () => {
    if (!file) return;
    setError("");
    const meta = { filename: file.name, size: file.size, category, gameId, practiceId, name };
    try {
      setStage("Checking the file…");
      const prep = await prepareUpload(meta);
      if (!prep.ok) { setError(prep.error); return; }
      setStage("Uploading…");
      const up = await createClient().storage.from("documents").uploadToSignedUrl(prep.path, prep.token, file, { contentType: TYPES[extensionOf(file.name)] });
      if (up.error) { setError(`The upload didn't go through: ${up.error.message}`); return; }
      setStage("Saving…");
      const fin = await finishUpload(prep.path, meta);
      if (fin.error) { setError(fin.error); return; }
      onDone();
    } catch {
      setError("Something interrupted the upload. Check your signal and try again.");
    } finally {
      setStage("");
    }
  };

  return (
    <div className="space-y-3">
      <div>
        <input ref={fileRef} type="file" accept={ACCEPT} className="sr-only" onChange={(e) => pick(e.target.files?.[0] ?? null)} aria-label="Choose a file" />
        <button className={`${btnPlain} w-full justify-start gap-3 py-3 text-left`} onClick={() => fileRef.current?.click()} disabled={busy}>
          <span className="rounded bg-green-900 px-3 py-1 text-white">Choose file</span>
          <span className="min-w-0 truncate">{file ? `${file.name} · ${formatSize(file.size)}` : "PDF, Word, Excel, PowerPoint, text or a photo · up to 25 MB"}</span>
        </button>
      </div>
      {file && (
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="text-sm font-medium sm:col-span-2">Name<input className={inputCls} value={name} onChange={(e) => setName(e.target.value)} disabled={busy} /></label>
          <label className="text-sm font-medium">Category
            <select className={inputCls} value={category} onChange={(e) => setCategory(e.target.value as Category)} disabled={busy}>{CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}</select>
          </label>
          <label className="text-sm font-medium">For a Game (optional)
            <select className={inputCls} value={gameId} onChange={(e) => setGameId(e.target.value)} disabled={busy}><option value="">No game</option>{lookups.games.map((g) => <option key={g.id} value={g.id}>{g.label}</option>)}</select>
          </label>
          <label className="text-sm font-medium sm:col-span-2">For a Practice (optional)
            <select className={inputCls} value={practiceId} onChange={(e) => setPracticeId(e.target.value)} disabled={busy}><option value="">No practice</option>{lookups.practices.map((p) => <option key={p.id} value={p.id}>{p.label}</option>)}</select>
          </label>
        </div>
      )}
      <div className="flex flex-wrap items-center gap-2">
        <p role="alert" className="min-w-0 flex-1 text-sm text-red-700">{error || (busy ? stage : "")}</p>
        <button className={btnPlain} onClick={onDone} disabled={busy}>Cancel</button>
        <button className={btnPrimary} onClick={upload} disabled={!file || busy}>{busy ? "Working…" : "Upload"}</button>
      </div>
    </div>
  );
}

function DocEdit({ doc, lookups, onDone }: { doc: Doc; lookups: Lookups; onDone: () => void }) {
  const [name, setName] = useState(doc.name);
  const [category, setCategory] = useState<string>(doc.category);
  const [gameId, setGameId] = useState(doc.gameId ?? "");
  const [practiceId, setPracticeId] = useState(doc.practiceId ?? "");
  const [error, setError] = useState("");
  const [pending, start] = useTransition();
  const run = (fn: () => Promise<{ error: string }>) => start(async () => { const r = await fn(); if (r.error) setError(r.error); else { setError(""); onDone(); } });
  return (
    <div className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="text-sm font-medium sm:col-span-2">Name<input className={inputCls} value={name} onChange={(e) => setName(e.target.value)} /></label>
        <label className="text-sm font-medium">Category<select className={inputCls} value={category} onChange={(e) => setCategory(e.target.value)}>{CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}</select></label>
        <label className="text-sm font-medium">For a Game<select className={inputCls} value={gameId} onChange={(e) => setGameId(e.target.value)}><option value="">No game</option>{lookups.games.map((g) => <option key={g.id} value={g.id}>{g.label}</option>)}</select></label>
        <label className="text-sm font-medium sm:col-span-2">For a Practice<select className={inputCls} value={practiceId} onChange={(e) => setPracticeId(e.target.value)}><option value="">No practice</option>{lookups.practices.map((p) => <option key={p.id} value={p.id}>{p.label}</option>)}</select></label>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <p role="alert" className="min-w-0 flex-1 text-sm text-red-700">{error}</p>
        <button className={btnDanger} disabled={pending} onClick={() => { if (window.confirm(`Delete “${doc.name}”? The file is removed for good. This can't be undone.`)) run(() => deleteDocument(doc.id)); }}>Delete</button>
        <button className={btnPlain} onClick={onDone}>Cancel</button>
        <button className={btnPrimary} disabled={pending} onClick={() => run(() => updateDocument(doc.id, { name, category, gameId, practiceId }))}>{pending ? "Saving…" : <><Icon name="check" />Save</>}</button>
      </div>
    </div>
  );
}

function Row({ doc, lookups }: { doc: Doc; lookups: Lookups }) {
  const [open, setOpen] = useState(false);
  const label = (list: Choice[], id: string | null) => list.find((x) => x.id === id)?.label;
  const cat = CATEGORIES.find((c) => c.value === doc.category)?.label;
  const links = [label(lookups.games, doc.gameId), label(lookups.practices, doc.practiceId)].filter(Boolean);
  const [reading, startReading] = useTransition();
  const [readNote, setReadNote] = useState("");
  const shown = isReadableCategory(doc.category);
  const state = doc.textChars === null ? "unread" : doc.textChars === 0 ? "none" : "ready";
  const read = () => startReading(async () => { const r = await readDocument(doc.id); setReadNote(r.error || r.note || ""); });
  return (
    <li>
      <div className="flex items-center gap-2 px-3 py-2">
        <a href={`/documents/${doc.id}/file`} target="_blank" rel="noopener noreferrer" className="min-h-14 min-w-0 flex-1 py-1">
          <span className="block truncate font-medium text-green-600 underline">{doc.name} <Icon name="external" size={14} /></span>
          <span className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-neutral-600">
            <Pill>{cat}</Pill>
            {state === "ready" && <Pill tone={shown ? "green" : "quiet"}>{shown ? "Assistant Can Read" : "Read, But Kept Private"}</Pill>}
            {state === "none" && <Pill tone="gold">No Text Found</Pill>}
            <span>{kindOf(doc.mime)} · {formatSize(doc.size)}</span>
            {links.map((l) => <span key={l}>{l}</span>)}
            <span>{prettyDate(doc.created.slice(0, 10))}</span>
          </span>
        </a>
        <button className={btnPlain} aria-expanded={open} onClick={() => setOpen(!open)}>{open ? <><Icon name="x" />Close</> : <><Icon name="pencil" />Edit</>}</button>
      </div>
      {(state !== "ready" || readNote) && canReadMime(doc.mime) && (
        <div className="flex flex-wrap items-center gap-2 px-3 pb-2 text-sm">
          {state !== "ready" && <button className={btnPlain} disabled={reading} onClick={read}><Icon name="book" />{reading ? "Reading…" : state === "none" ? "Try Reading Again" : "Let the Assistant Read This"}</button>}
          {readNote && <span className="text-neutral-700">{readNote}</span>}
        </div>
      )}
      {open && <div className="bg-wash px-3 py-3"><DocEdit doc={doc} lookups={lookups} onDone={() => setOpen(false)} /></div>}
    </li>
  );
}

export function DocumentsView({ docs, lookups, initial }: { docs: Doc[]; lookups: Lookups; initial: Initial }) {
  const [adding, setAdding] = useState(initial.add);
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("all");
  const [sort, setSort] = useState("newest");
  const term = q.trim().toLowerCase();
  const find = (list: Choice[], id: string | null) => list.find((x) => x.id === id)?.label ?? "";
  const list = docs
    .filter((d) => cat === "all" || d.category === cat)
    .filter((d) => !term || `${d.name} ${find(lookups.games, d.gameId)} ${find(lookups.practices, d.practiceId)}`.toLowerCase().includes(term))
    .sort((a, b) => (sort === "name" ? a.name.localeCompare(b.name, undefined, { sensitivity: "base" }) : sort === "oldest" ? a.created.localeCompare(b.created) : b.created.localeCompare(a.created)));
  const filtered = q !== "" || cat !== "all";

  return (
    <div className="space-y-4">
      <PageHeader title={`Library · ${docs.length}`} subtitle="Playbooks, scouting reports and anything else you want at your fingertips">
        <button className={btnPrimary} onClick={() => setAdding(!adding)}>{adding ? <><Icon name="x" />Close</> : <><Icon name="plus" />Add Document</>}</button>
      </PageHeader>

      {adding && (
        <section className="space-y-3 rounded-2xl bg-white p-5 shadow-sm">
          <h2>Add a Document</h2>
          <Uploader lookups={lookups} initial={initial} onDone={() => setAdding(false)} />
        </section>
      )}

      <ListToolbar
        search={q} onSearch={setQ} placeholder="Search documents"
        sort={{ value: sort, options: [{ value: "newest", label: "Newest first" }, { value: "oldest", label: "Oldest first" }, { value: "name", label: "Name" }], onChange: setSort }}
        filters={[{ label: "Type", value: cat, onChange: setCat, options: [{ value: "all", label: "All" }, ...CATEGORIES.map((c) => ({ value: c.value, label: c.label }))] }]}
        summary={`Showing ${list.length} of ${docs.length}`} canReset={filtered} onReset={() => { setQ(""); setCat("all"); }}
      />

      <ul className="divide-y divide-neutral-200 overflow-hidden rounded-2xl bg-white shadow-sm">
        {list.map((d) => <Row key={d.id} doc={d} lookups={lookups} />)}
        {list.length === 0 && <li className="px-4 py-6 text-center text-sm text-neutral-500">{docs.length === 0 ? "Nothing here yet. Add your playbook or the next scouting report." : "Nothing matches."}</li>}
      </ul>
    </div>
  );
}
