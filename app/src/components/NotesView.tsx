"use client";

import { useState, useTransition } from "react";
import { createNote, deleteNote, setNoteDone, updateNote } from "@/app/notes/actions";
import type { Note } from "@/lib/db-types";
import { filterNotes, NO_NOTE_FILTERS, sortNotes, type NoteFilters, type NoteSort } from "@/lib/lists";
import { isOverdue } from "@/lib/notes";
import { prettyDate } from "@/lib/time";
import { ListToolbar } from "./ListToolbar";
import { PageHeader } from "./PageHeader";
import { btnDanger, btnPlain, btnPrimary, inputCls } from "./ui";

type Choice = { id: string; label: string };
type Lookups = { players: Choice[]; coaches: Choice[]; practices: Choice[] };

function NoteForm({ note, initial, lookups, onDone }: { note: Note | null; initial?: { kind?: "note" | "action"; practiceId?: string }; lookups: Lookups; onDone: () => void }) {
  const [kind, setKind] = useState<"note" | "action">(note?.kind ?? initial?.kind ?? "note");
  const [body, setBody] = useState(note?.body ?? "");
  const [playerId, setPlayerId] = useState(note?.playerId ?? "");
  const [practiceId, setPracticeId] = useState(note?.practiceId ?? initial?.practiceId ?? "");
  const [owner, setOwner] = useState(note?.owner ?? "");
  const [due, setDue] = useState(note?.due ?? "");
  const [error, setError] = useState("");
  const [pending, start] = useTransition();

  const save = () => start(async () => {
    const payload = { kind, body, playerId, practiceId, owner, due };
    const r = note ? await updateNote(note.id, payload) : await createNote(payload);
    if (r.error) setError(r.error); else { setError(""); onDone(); }
  });
  const remove = () => {
    if (note && window.confirm("Delete this? This can't be undone.")) start(async () => { const r = await deleteNote(note.id); if (r.error) setError(r.error); else onDone(); });
  };

  return (
    <div className="space-y-3">
      <div className="flex overflow-hidden rounded-lg border border-neutral-300 text-sm font-semibold">
        {(["note", "action"] as const).map((k) => (
          <button key={k} onClick={() => setKind(k)} aria-pressed={kind === k} className={`min-h-12 flex-1 px-3 ${kind === k ? "bg-green-900 text-white" : "bg-white"}`}>{k === "note" ? "Note" : "Action item"}</button>
        ))}
      </div>
      <label className="block text-sm font-medium">{kind === "action" ? "What needs to happen?" : "What do you want to remember?"}
        <textarea className={`${inputCls} min-h-28 py-2`} value={body} onChange={(e) => setBody(e.target.value)} autoFocus={!note} placeholder={kind === "action" ? "Send Pea Ridge film to Coursey" : "Tap the microphone on your keyboard to talk instead of type"} />
      </label>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="text-sm font-medium">About a player (optional)
          <select className={inputCls} value={playerId} onChange={(e) => setPlayerId(e.target.value)}><option value="">No player</option>{lookups.players.map((p) => <option key={p.id} value={p.id}>{p.label}</option>)}</select>
        </label>
        <label className="text-sm font-medium">From a practice (optional)
          <select className={inputCls} value={practiceId} onChange={(e) => setPracticeId(e.target.value)}><option value="">No practice</option>{lookups.practices.map((p) => <option key={p.id} value={p.id}>{p.label}</option>)}</select>
        </label>
        {kind === "action" && (
          <>
            <label className="text-sm font-medium">Who owns it (optional)
              <select className={inputCls} value={owner} onChange={(e) => setOwner(e.target.value)}><option value="">Nobody yet</option>{lookups.coaches.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}</select>
            </label>
            <label className="text-sm font-medium">Due (optional)
              <input type="date" className={inputCls} value={due} onChange={(e) => setDue(e.target.value)} />
            </label>
          </>
        )}
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <p role="alert" className="min-w-0 flex-1 text-sm text-red-700">{error}</p>
        {note && <button className={btnDanger} disabled={pending} onClick={remove}>Delete</button>}
        <button className={btnPlain} onClick={onDone}>Cancel</button>
        <button className={`${btnPrimary} px-6`} disabled={pending} onClick={save}>{pending ? "Saving…" : "Save"}</button>
      </div>
    </div>
  );
}

function Row({ note, lookups, today }: { note: Note; lookups: Lookups; today: string }) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState("");
  const [pending, start] = useTransition();
  const label = (list: Choice[], id: string | null) => list.find((x) => x.id === id)?.label;
  const overdue = isOverdue(note, today);
  const action = note.kind === "action";
  const done = note.status === "done";
  const meta = [
    label(lookups.players, note.playerId),
    label(lookups.practices, note.practiceId),
    action && note.owner ? `Owner: ${label(lookups.coaches, note.owner) ?? note.owner}` : null,
  ].filter(Boolean);

  const toggle = () => start(async () => { const r = await setNoteDone(note.id, !done); setError(r.error); });

  return (
    <li className="border-b border-neutral-200 last:border-0">
      <div className="flex items-start gap-1 px-2 py-1">
        {action ? (
          <button onClick={toggle} disabled={pending} aria-label={done ? "Mark as not done" : "Mark as done"} aria-pressed={done} className="flex min-h-12 min-w-12 items-center justify-center">
            <span className={`flex h-7 w-7 items-center justify-center rounded-full border-2 text-sm font-bold ${done ? "border-green-900 bg-green-900 text-white" : "border-neutral-400 bg-white"}`}>{done ? "✓" : ""}</span>
          </button>
        ) : <span className="min-w-3" />}
        <button className="min-h-14 min-w-0 flex-1 py-2 pr-2 text-left" aria-expanded={open} onClick={() => setOpen(!open)}>
          <p className={`whitespace-pre-wrap ${done ? "text-neutral-500 line-through" : ""}`}>{note.body}</p>
          <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-neutral-600">
            <span className={`rounded-full px-2 py-0.5 font-semibold ${action ? "bg-gold-500 text-green-900" : "bg-neutral-200 text-neutral-700"}`}>{action ? "Action" : "Note"}</span>
            {action && note.due && !done && <span className={overdue ? "font-semibold text-red-800" : ""}>{overdue ? "Overdue · " : "Due "}{prettyDate(note.due)}</span>}
            {meta.map((m) => <span key={m}>{m}</span>)}
            <span>{prettyDate(note.created.slice(0, 10))}</span>
          </p>
          {error && <p role="alert" className="mt-1 text-sm text-red-700">{error}</p>}
        </button>
      </div>
      {open && <div className="bg-wash px-3 py-3"><NoteForm note={note} lookups={lookups} onDone={() => setOpen(false)} /></div>}
    </li>
  );
}

const SORTS: { value: NoteSort; label: string }[] = [{ value: "newest", label: "Newest first" }, { value: "oldest", label: "Oldest first" }, { value: "due", label: "Due date" }];

export function NotesView({ notes, lookups, today, initial }: { notes: Note[]; lookups: Lookups; today: string; initial: { add: boolean; kind?: "note" | "action"; practiceId?: string; show?: NoteFilters["show"] } }) {
  const [filters, setFilters] = useState<NoteFilters>({ ...NO_NOTE_FILTERS, show: initial.show ?? "all" });
  const [sort, setSort] = useState<NoteSort>(initial.show === "open" ? "due" : "newest");
  const [adding, setAdding] = useState(initial.add);
  const find = (list: Choice[], id: string | null) => list.find((x) => x.id === id)?.label ?? "";
  const list = sortNotes(filterNotes(notes, filters, (n) => `${n.body} ${find(lookups.players, n.playerId)} ${find(lookups.practices, n.practiceId)} ${find(lookups.coaches, n.owner)}`), sort, today);
  const open = notes.filter((n) => n.kind === "action" && n.status === "open").length;
  const filtered = JSON.stringify(filters) !== JSON.stringify(NO_NOTE_FILTERS);

  return (
    <div className="space-y-4">
      <PageHeader title="Notes & actions" subtitle={open > 0 ? `${open} open action item${open === 1 ? "" : "s"}` : "No open action items"}>
        <button className={btnPrimary} onClick={() => setAdding(!adding)}>{adding ? "Close" : "Add note"}</button>
      </PageHeader>

      {adding && (
        <section className="space-y-3 rounded-xl bg-white p-4 shadow-sm">
          <h2>New note</h2>
          <NoteForm note={null} initial={initial} lookups={lookups} onDone={() => setAdding(false)} />
        </section>
      )}

      <ListToolbar
        search={filters.q} onSearch={(v) => setFilters((f) => ({ ...f, q: v }))} placeholder="Search notes"
        sort={{ value: sort, options: SORTS, onChange: (v) => setSort(v as NoteSort) }}
        filters={[{ label: "Show", value: filters.show, onChange: (v) => setFilters((f) => ({ ...f, show: v as NoteFilters["show"] })), options: [{ value: "all", label: "All" }, { value: "open", label: "Open actions" }, { value: "done", label: "Done" }, { value: "notes", label: "Notes" }] }]}
        summary={`Showing ${list.length} of ${notes.length}`} canReset={filtered} onReset={() => setFilters(NO_NOTE_FILTERS)}
      />

      <ul className="overflow-hidden rounded-xl bg-white shadow-sm">
        {list.map((n) => <Row key={n.id} note={n} lookups={lookups} today={today} />)}
        {list.length === 0 && <li className="px-3 py-6 text-center text-sm text-neutral-500">{notes.length === 0 ? "Nothing yet. Add the first note after practice." : "Nothing matches."}</li>}
      </ul>
    </div>
  );
}
