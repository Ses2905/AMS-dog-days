"use client";

import { useState, useTransition } from "react";
import { createNote, deleteNote } from "@/app/notes/actions";
import type { Note, NoteCategory } from "@/lib/db-types";
import { NOTE_CATEGORIES } from "@/lib/notes";
import { prettyDate } from "@/lib/time";
import { btnDanger, btnPrimary, inputCls } from "./ui";

/** Running notes on one player, grouped by what they are about. Parent contact is kept apart and marked private. */
export function PlayerNotes({ playerId, notes }: { playerId: string; notes: Note[] }) {
  const [category, setCategory] = useState<NoteCategory>("performance");
  const [body, setBody] = useState("");
  const [error, setError] = useState("");
  const [pending, start] = useTransition();
  const add = () => start(async () => {
    const r = await createNote({ kind: "note", category, body, playerId });
    if (r.error) setError(r.error); else { setError(""); setBody(""); }
  });
  const remove = (n: Note) => {
    if (window.confirm("Delete this note? This can't be undone.")) start(async () => { const r = await deleteNote(n.id); if (r.error) setError(r.error); });
  };
  const hint = NOTE_CATEGORIES.find((c) => c.value === category)!.hint;
  return (
    <section className="space-y-4 rounded-xl bg-white p-4 shadow-sm">
      <h2>Coach Notes</h2>
      <div className="space-y-2">
        <div className="flex flex-wrap gap-2" role="group" aria-label="Kind of note">
          {NOTE_CATEGORIES.map((c) => (
            <button key={c.value} aria-pressed={category === c.value} onClick={() => setCategory(c.value)} className={`min-h-12 rounded-lg px-3 text-sm font-semibold ${category === c.value ? "bg-green-900 text-white" : "border border-neutral-300 bg-white"}`}>{c.label}</button>
          ))}
        </div>
        <textarea className={`${inputCls} min-h-24 py-2`} value={body} onChange={(e) => setBody(e.target.value)} placeholder={hint} aria-label={`New ${category} note`} />
        <div className="flex items-center gap-3">
          <p role="alert" className="min-w-0 flex-1 text-sm text-red-700">{error}</p>
          <button className={btnPrimary} disabled={pending || !body.trim()} onClick={add}>{pending ? "Saving…" : "Add Note"}</button>
        </div>
      </div>
      {NOTE_CATEGORIES.map((c) => {
        const list = notes.filter((n) => n.category === c.value);
        if (list.length === 0) return null;
        return (
          <div key={c.value}>
            <h3 className="font-display text-lg font-semibold uppercase tracking-wide">{c.label}{c.value === "parent" && <span className="ml-2 font-sans text-xs font-semibold normal-case tracking-normal text-neutral-600">Private. Never shared with the assistant.</span>}</h3>
            <ul className="divide-y divide-neutral-200">
              {list.map((n) => (
                <li key={n.id} className="flex items-start gap-2 py-2">
                  <div className="min-w-0 flex-1"><p className="whitespace-pre-wrap">{n.body}</p><p className="text-xs text-neutral-600">{prettyDate(n.created.slice(0, 10))}</p></div>
                  <button className={btnDanger} disabled={pending} aria-label="Delete note" onClick={() => remove(n)}>Delete</button>
                </li>
              ))}
            </ul>
          </div>
        );
      })}
      {notes.length === 0 && <p className="text-sm text-neutral-600">Nothing yet. Performance, position ideas, challenges, what to work on, and parent contact all live here.</p>}
    </section>
  );
}
