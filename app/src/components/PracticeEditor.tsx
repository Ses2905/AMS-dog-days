"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { savePractice } from "@/app/practice/[id]/edit/actions";
import { startTimes, type EditPayload } from "@/lib/practice-edit";
import { addMinutes } from "@/lib/time";
import type { Practice } from "@/lib/types";

type Draft = { key: number; mode: "span" | "lanes"; span: string; lanes: Record<string, string>; periods: number; flex: boolean };

const input = "mt-1 min-h-12 w-full rounded-lg border border-neutral-300 bg-white px-3 text-base";
const btn = "inline-flex min-h-12 min-w-12 items-center justify-center rounded-lg border border-neutral-300 bg-white px-3 text-sm font-medium disabled:opacity-40";

export function PracticeEditor({ practice }: { practice: Practice }) {
  const [start, setStart] = useState(practice.blocks[0]?.start ?? "");
  const [dress, setDress] = useState(practice.dress);
  const [lift, setLift] = useState(practice.lift ?? "");
  const [opponent, setOpponent] = useState(practice.opponent ?? "");
  const [odMeeting, setOdMeeting] = useState(practice.odMeeting ?? "");
  const [situations, setSituations] = useState(practice.situations ?? "");
  const [notes, setNotes] = useState(practice.notes.join("\n"));
  const [coaches, setCoaches] = useState(practice.coaches);
  const [newCoach, setNewCoach] = useState("");
  const [nextKey, setNextKey] = useState(practice.blocks.length);
  const [blocks, setBlocks] = useState<Draft[]>(
    practice.blocks.map((b, i) => ({ key: i, mode: b.span ? "span" : "lanes", span: b.span ?? "", lanes: b.lanes ?? {}, periods: b.periods, flex: b.flex === true })),
  );
  const [error, setError] = useState("");
  const [pending, startSave] = useTransition();

  const starts = startTimes(start || "12:00", blocks);
  const patch = (i: number, p: Partial<Draft>) => setBlocks((bs) => bs.map((b, j) => (j === i ? { ...b, ...p } : b)));
  const move = (i: number, d: -1 | 1) =>
    setBlocks((bs) => {
      const j = i + d;
      if (j < 0 || j >= bs.length) return bs;
      const c = [...bs];
      [c[i], c[j]] = [c[j], c[i]];
      return c;
    });
  const addBlock = (after: number) => {
    setBlocks((bs) => [...bs.slice(0, after + 1), { key: nextKey, mode: "span", span: "", lanes: {}, periods: 1, flex: false }, ...bs.slice(after + 1)]);
    setNextKey(nextKey + 1);
  };
  const addCoach = () => {
    const name = newCoach.trim();
    if (name && !coaches.includes(name)) setCoaches([...coaches, name]);
    setNewCoach("");
  };

  const save = () => {
    setError("");
    const payload: EditPayload = {
      start, dress, lift, opponent, odMeeting, situations, coaches,
      notes: notes.split("\n"),
      blocks: blocks.map((b) => ({ periods: b.periods, flex: b.flex, ...(b.mode === "span" ? { span: b.span } : { lanes: b.lanes }) })),
    };
    startSave(async () => {
      const res = await savePractice(practice.id, payload);
      if (res?.error) setError(res.error);
    });
  };

  return (
    <div className="space-y-6 pb-28">
      <section className="grid gap-3 rounded-xl bg-white p-4 shadow-sm sm:grid-cols-2">
        <label className="text-sm font-medium">Practice starts (first period)<input className={input} value={start} onChange={(e) => setStart(e.target.value)} inputMode="numeric" placeholder="6:55" /></label>
        <label className="text-sm font-medium">Dress<input className={input} value={dress} onChange={(e) => setDress(e.target.value)} /></label>
        <label className="text-sm font-medium">Lift<input className={input} value={lift} onChange={(e) => setLift(e.target.value)} /></label>
        <label className="text-sm font-medium">Opponent<input className={input} value={opponent} onChange={(e) => setOpponent(e.target.value)} /></label>
        <label className="text-sm font-medium">O/D meeting<input className={input} value={odMeeting} onChange={(e) => setOdMeeting(e.target.value)} /></label>
        <label className="text-sm font-medium">Situations<input className={input} value={situations} onChange={(e) => setSituations(e.target.value)} /></label>
      </section>

      <section className="space-y-3 rounded-xl bg-white p-4 shadow-sm">
        <h2 className="font-semibold">Coaches (columns)</h2>
        <ul className="flex flex-wrap gap-2">
          {coaches.map((c) => (
            <li key={c} className="flex items-center gap-1 rounded-full bg-wash py-1 pl-3 pr-1 text-sm">
              {c}
              <button aria-label={`Remove ${c}`} className="min-h-9 min-w-9 rounded-full text-lg leading-none hover:bg-white" onClick={() => setCoaches(coaches.filter((x) => x !== c))}>×</button>
            </li>
          ))}
        </ul>
        <div className="flex gap-2">
          <input className={`${input} mt-0`} value={newCoach} onChange={(e) => setNewCoach(e.target.value)} onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addCoach())} placeholder="Add a coach" />
          <button className={btn} onClick={addCoach}>Add</button>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="font-semibold">Periods</h2>
        {blocks.map((b, i) => {
          const end = addMinutes(starts[i], b.periods * 5);
          return (
            <div key={b.key} className="space-y-3 rounded-xl bg-white p-4 shadow-sm">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-mono text-sm tabular-nums">{starts[i]} to {end}</span>
                <span className="text-sm text-neutral-500">{b.periods * 5} min</span>
                <div className="ml-auto flex gap-1">
                  <button className={btn} aria-label="Move up" disabled={i === 0} onClick={() => move(i, -1)}>↑</button>
                  <button className={btn} aria-label="Move down" disabled={i === blocks.length - 1} onClick={() => move(i, 1)}>↓</button>
                  <button className={btn} aria-label="Delete period" onClick={() => setBlocks(blocks.filter((_, j) => j !== i))}>Delete</button>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-1">
                  <button className={btn} aria-label="Shorter" disabled={b.periods <= 1} onClick={() => patch(i, { periods: b.periods - 1 })}>−5</button>
                  <span className="w-16 text-center text-sm">{b.periods} × 5 min</span>
                  <button className={btn} aria-label="Longer" disabled={b.periods >= 24} onClick={() => patch(i, { periods: b.periods + 1 })}>+5</button>
                </div>
                <div className="flex overflow-hidden rounded-lg border border-neutral-300 text-sm">
                  <button className={`min-h-12 px-3 ${b.mode === "span" ? "bg-green-900 text-white" : "bg-white"}`} onClick={() => patch(i, { mode: "span" })}>Everyone</button>
                  <button className={`min-h-12 px-3 ${b.mode === "lanes" ? "bg-green-900 text-white" : "bg-white"}`} onClick={() => patch(i, { mode: "lanes" })}>By coach</button>
                </div>
                {b.mode === "span" && (
                  <label className="flex items-center gap-2 text-sm"><input type="checkbox" className="h-5 w-5" checked={b.flex} onChange={(e) => patch(i, { flex: e.target.checked })} />Warm-up (not numbered)</label>
                )}
              </div>

              {b.mode === "span" ? (
                <input className={`${input} mt-0`} value={b.span} onChange={(e) => patch(i, { span: e.target.value })} placeholder="Break, Halftime, Team O…" />
              ) : (
                <div className="grid gap-2 sm:grid-cols-2">
                  {coaches.map((c) => (
                    <label key={c} className="text-sm font-medium">{c}
                      <input className={input} value={b.lanes[c] ?? ""} onChange={(e) => patch(i, { lanes: { ...b.lanes, [c]: e.target.value } })} />
                    </label>
                  ))}
                </div>
              )}
              <button className="text-sm text-green-600 underline" onClick={() => addBlock(i)}>+ Add a period after this one</button>
            </div>
          );
        })}
        {blocks.length === 0 && <button className={btn} onClick={() => addBlock(-1)}>+ Add a period</button>}
      </section>

      <section className="rounded-xl bg-white p-4 shadow-sm">
        <label className="text-sm font-medium">Notes (one per line)
          <textarea className={`${input} min-h-32 py-2`} value={notes} onChange={(e) => setNotes(e.target.value)} />
        </label>
      </section>

      <div className="fixed inset-x-0 bottom-0 border-t border-neutral-200 bg-white/95 p-3 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center gap-3">
          <p role="alert" className="min-w-0 flex-1 text-sm text-red-700">{error}</p>
          <Link href={`/practice/${practice.id}`} className={btn}>Cancel</Link>
          <button onClick={save} disabled={pending} className="min-h-12 rounded-lg bg-green-900 px-6 font-semibold text-white disabled:opacity-60">{pending ? "Saving…" : "Save"}</button>
        </div>
      </div>
    </div>
  );
}
