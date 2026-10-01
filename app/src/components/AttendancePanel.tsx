"use client";

import { useMemo, useState, useSyncExternalStore, useTransition } from "react";
import { markEveryonePresent, setAttendance } from "@/app/practice/[id]/attendance-actions";
import { MARKS, MARK_LABEL, tally, type Mark } from "@/lib/attendance";
import { statusOn, STATUS_LABEL } from "@/lib/availability";
import { withPending } from "@/lib/outbox";
import { pendingFrom, pendingTap, queuePending, readOutboxRaw, subscribeOutbox } from "@/lib/outbox-store";
import type { Player } from "@/lib/types";
import { btnOutline, chip } from "./ui";

const ON: Record<Mark, string> = { present: "bg-green-900 text-white", late: "bg-gold-500 text-green-900", absent: "bg-red-700 text-white", excused: "bg-neutral-500 text-white" };

/** Tap a mark next to a name. Each tap saves on its own, so half-finished attendance is never lost. */
export function AttendancePanel({ practiceId, date, players, initial }: { practiceId: string; date: string; players: Player[]; initial: Record<string, Mark> }) {
  const [saved, setMarks] = useState(initial);
  const raw = useSyncExternalStore(subscribeOutbox, readOutboxRaw, () => null);
  const marks = useMemo(() => withPending(saved, pendingFrom(raw), practiceId), [saved, raw, practiceId]);
  const [error, setError] = useState("");
  const [grade, setGrade] = useState<"all" | 8 | 9>("all");
  const [onlyUnmarked, setOnlyUnmarked] = useState(false);
  const [pending, start] = useTransition();

  const shown = players.filter((p) => (grade === "all" || p.grade === grade) && (!onlyUnmarked || !marks[p.id])).sort((a, b) => a.number - b.number);
  const t = tally(Object.keys(marks).filter((id) => players.some((p) => p.id === id)).map((id) => marks[id]), players.length);

  const tap = (p: Player, m: Mark) => {
    const next = marks[p.id] === m ? null : m; // tapping the chosen mark again clears it
    const before = saved;
    setMarks((cur) => { const c = { ...cur }; if (next) c[p.id] = next; else delete c[p.id]; return c; });
    const entry = pendingTap(practiceId, p.id, next);
    start(async () => {
      // No signal at the field: keep the tap on this phone and let OutboxSync send it later.
      if (!navigator.onLine) { queuePending(entry); setError(""); return; }
      try {
        const r = await setAttendance(practiceId, p.id, next);
        if (r.error) { setError(r.error); setMarks(before); } else setError("");
      } catch { queuePending(entry); setError(""); }
    });
  };
  const everyone = () => start(async () => {
    if (!navigator.onLine) { setError("Everyone Present needs a signal. Tap each player instead, or try again when you are back online."); return; }
    let r: Awaited<ReturnType<typeof markEveryonePresent>>;
    try { r = await markEveryonePresent(practiceId); } catch { setError("Could not reach the server. Tap each player instead, or try again in a moment."); return; }
    if (r.error) { setError(r.error); return; }
    setError("");
    // Re-read what the server decided by marking the same players locally.
    setMarks((cur) => {
      const c = { ...cur };
      for (const p of players) if (!c[p.id] && ["available", "limited"].includes(statusOn(p, date))) c[p.id] = "present";
      return c;
    });
  });

  return (
    <section id="attendance" className="scroll-mt-4 space-y-3 rounded-2xl bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-center gap-2">
        <h2>Attendance</h2>
        <p className="text-sm text-neutral-600">{t.marked} of {players.length} marked · {t.there} there{t.late ? ` (${t.late} late)` : ""} · {t.absent} absent · {t.excused} excused</p>
        <button className={`${btnOutline} ml-auto`} disabled={pending || t.unmarked === 0} onClick={everyone}>Everyone Present</button>
      </div>
      <p className="text-xs text-neutral-600">Skips anyone marked out or excused on the roster. Tap a mark again to clear it.</p>
      <div className="flex flex-wrap gap-2" role="group" aria-label="Filter attendance list">
        {([["all", "All"], [9, "9th"], [8, "8th"]] as const).map(([v, label]) => (
          <button key={label} aria-pressed={grade === v} onClick={() => setGrade(v)} className={chip(grade === v)}>{label}</button>
        ))}
        <button aria-pressed={onlyUnmarked} onClick={() => setOnlyUnmarked(!onlyUnmarked)} className={chip(onlyUnmarked)}>Not Marked ({t.unmarked})</button>
      </div>
      {error && <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-800">{error}</p>}
      <ul className="divide-y divide-neutral-200">
        {shown.map((p) => {
          const avail = statusOn(p, date);
          return (
            <li key={p.id} className="py-2">
              <p className="mb-1 flex flex-wrap items-baseline gap-2"><span className="font-display text-xl font-semibold">#{p.number}</span><span className="font-medium">{p.first} {p.last}</span>{avail !== "available" && <span className="rounded-full bg-neutral-200 px-2 py-0.5 text-xs font-semibold">{STATUS_LABEL[avail]} on roster</span>}</p>
              <div className="grid grid-cols-4 gap-1.5">
                {MARKS.map((m) => (
                  <button key={m} aria-pressed={marks[p.id] === m} onClick={() => tap(p, m)} className={`min-h-12 rounded-lg text-sm font-semibold ${marks[p.id] === m ? ON[m] : "border border-neutral-300 bg-white"}`}>{MARK_LABEL[m]}</button>
                ))}
              </div>
            </li>
          );
        })}
        {shown.length === 0 && <li className="py-3 text-sm text-neutral-600">{onlyUnmarked ? "Everyone in this group is marked." : "No players."}</li>}
      </ul>
    </section>
  );
}
