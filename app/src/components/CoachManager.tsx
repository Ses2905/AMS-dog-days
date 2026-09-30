"use client";

import { useState, useTransition } from "react";
import { deleteCoach, saveCoach } from "@/app/roster/admin-actions";
import type { Coach } from "@/lib/db";

const input = "min-h-12 w-full rounded-lg border border-neutral-300 bg-white px-3 text-base";
const btn = "inline-flex min-h-12 items-center justify-center rounded-lg border border-neutral-300 bg-white px-4 text-sm font-semibold disabled:opacity-50";

function Row({ coach, onDone }: { coach: Coach | null; onDone?: () => void }) {
  const [open, setOpen] = useState(coach === null);
  const [first, setFirst] = useState(coach?.first ?? "");
  const [last, setLast] = useState(coach?.last ?? "");
  const [role, setRole] = useState(coach?.role ?? "Coach");
  const [active, setActive] = useState(coach?.active ?? true);
  const [error, setError] = useState("");
  const [pending, start] = useTransition();

  const run = (fn: () => Promise<{ error: string }>, after?: () => void) => start(async () => { const r = await fn(); if (r.error) setError(r.error); else { setError(""); after?.(); } });
  const save = () => run(() => saveCoach(coach?.id ?? null, { first, last, role, active }), () => {
    if (coach) setOpen(false); else { setFirst(""); setLast(""); setRole("Coach"); setActive(true); }
    onDone?.();
  });

  return (
    <li className="border-b border-neutral-200 last:border-0">
      {coach && !open && (
        <button className="flex min-h-14 w-full items-center gap-3 px-3 py-2 text-left hover:bg-wash" onClick={() => setOpen(true)}>
          <span className="min-w-0 flex-1"><span className="font-medium">{coach.first ? `${coach.first} ` : ""}{coach.last}</span><span className="block text-sm text-neutral-500">{coach.role}</span></span>
          {!coach.active && <span className="rounded-full bg-neutral-200 px-3 py-1 text-xs font-semibold text-neutral-700">Inactive</span>}
        </button>
      )}
      {open && (
        <div className="space-y-3 bg-wash px-3 py-3">
          {!coach && <h3>Add a coach</h3>}
          <div className="grid gap-2 sm:grid-cols-3">
            <label className="text-sm font-medium">First name (optional)<input className={input} value={first} onChange={(e) => setFirst(e.target.value)} /></label>
            <label className="text-sm font-medium">Last name<input className={input} value={last} onChange={(e) => setLast(e.target.value)} /></label>
            <label className="text-sm font-medium">Role<input className={input} value={role} onChange={(e) => setRole(e.target.value)} placeholder="Head Coach, Defensive Line…" /></label>
          </div>
          <label className="flex items-center gap-3 text-sm"><input type="checkbox" className="h-5 w-5" checked={active} onChange={(e) => setActive(e.target.checked)} />Coaching this season (shows up as a suggestion when planning)</label>
          <div className="flex flex-wrap items-center gap-2">
            <p role="alert" className="min-w-0 flex-1 text-sm text-red-700">{error}</p>
            {coach && <button className={`${btn} text-red-700`} disabled={pending} onClick={() => { if (window.confirm(`Remove ${coach.last} from the coach list? Past practices keep their name.`)) run(() => deleteCoach(coach.id)); }}>Remove</button>}
            {coach && <button className={btn} onClick={() => setOpen(false)}>Cancel</button>}
            <button onClick={save} disabled={pending} className="min-h-12 rounded-lg bg-green-900 px-6 font-semibold text-white disabled:opacity-60">{pending ? "Saving…" : coach ? "Save" : "Add coach"}</button>
          </div>
        </div>
      )}
    </li>
  );
}

export function CoachManager({ coaches }: { coaches: Coach[] }) {
  return (
    <div className="space-y-4">
      <ul className="overflow-hidden rounded-xl bg-white shadow-sm">{coaches.map((c) => <Row key={c.id} coach={c} />)}</ul>
      <ul className="overflow-hidden rounded-xl bg-white shadow-sm"><Row coach={null} /></ul>
    </div>
  );
}
