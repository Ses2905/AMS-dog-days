"use client";

import { useState, useTransition } from "react";
import { setPlayerStatus } from "@/app/roster/actions";
import { STATUSES, STATUS_LABEL, statusOn, type Status } from "@/lib/availability";
import { prettyDate } from "@/lib/time";
import type { Player } from "@/lib/types";

const chip: Record<Status, string> = {
  available: "bg-green-600/10 text-green-900",
  limited: "bg-[#f1ecd3] text-[#6b5b12]",
  out: "bg-red-100 text-red-800",
  excused: "bg-neutral-200 text-neutral-700",
};

function Row({ p, today }: { p: Player; today: string }) {
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState<Status>(p.status);
  const [note, setNote] = useState(p.statusNote ?? "");
  const [until, setUntil] = useState(p.statusUntil ?? "");
  const [error, setError] = useState("");
  const [pending, start] = useTransition();
  const shown = statusOn(p, today);

  const save = () =>
    start(async () => {
      const res = await setPlayerStatus({ playerId: p.id, status, note, until });
      if (res.error) setError(res.error);
      else { setError(""); setOpen(false); }
    });

  return (
    <li className="border-b border-neutral-200 last:border-0">
      <button className="flex min-h-14 w-full items-center gap-3 px-3 py-2 text-left hover:bg-wash" aria-expanded={open} onClick={() => setOpen(!open)}>
        <span className="w-9 font-mono tabular-nums text-neutral-500">{p.number}</span>
        <span className="min-w-0 flex-1">
          <span className="font-medium">{p.first} {p.last}</span>
          <span className="text-sm text-neutral-500"> · {p.grade}th</span>
          {p.otherNumbers.length > 0 && <span className="block text-xs text-neutral-500">also #{p.otherNumbers.join(", #")}</span>}
          {shown !== "available" && p.statusNote && <span className="block truncate text-xs text-neutral-600">{p.statusNote}{p.statusUntil ? ` · through ${prettyDate(p.statusUntil)}` : ""}</span>}
        </span>
        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${chip[shown]}`}>{STATUS_LABEL[shown]}</span>
      </button>
      {open && (
        <div className="space-y-3 bg-wash px-3 py-3">
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {STATUSES.map((s) => (
              <button key={s} onClick={() => setStatus(s)} className={`min-h-12 rounded-lg border text-sm font-semibold ${status === s ? "border-green-900 bg-green-900 text-white" : "border-neutral-300 bg-white"}`}>
                {STATUS_LABEL[s]}
              </button>
            ))}
          </div>
          {status !== "available" && (
            <div className="grid gap-2 sm:grid-cols-2">
              <label className="text-sm font-medium">Note (optional)
                <input className="mt-1 min-h-12 w-full rounded-lg border border-neutral-300 bg-white px-3 text-base" value={note} onChange={(e) => setNote(e.target.value)} placeholder="Ankle, family trip…" />
              </label>
              <label className="text-sm font-medium">Through (optional)
                <input type="date" className="mt-1 min-h-12 w-full rounded-lg border border-neutral-300 bg-white px-3 text-base" value={until} onChange={(e) => setUntil(e.target.value)} />
              </label>
            </div>
          )}
          <div className="flex items-center gap-3">
            <p role="alert" className="flex-1 text-sm text-red-700">{error}</p>
            <button onClick={() => setOpen(false)} className="min-h-12 rounded-lg border border-neutral-300 bg-white px-4 text-sm font-medium">Cancel</button>
            <button onClick={save} disabled={pending} className="min-h-12 rounded-lg bg-green-900 px-6 font-semibold text-white disabled:opacity-60">{pending ? "Saving…" : "Save"}</button>
          </div>
        </div>
      )}
    </li>
  );
}

export function PlayerList({ players, today }: { players: Player[]; today: string }) {
  const [q, setQ] = useState("");
  const [only, setOnly] = useState<"all" | "not-available">("all");
  const term = q.trim().toLowerCase();
  const list = players.filter((p) => {
    if (only === "not-available" && statusOn(p, today) === "available") return false;
    return !term || `${p.first} ${p.last}`.toLowerCase().includes(term) || String(p.number) === term;
  });
  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <input className="min-h-12 min-w-0 flex-1 rounded-lg border border-neutral-300 bg-white px-3 text-base" placeholder="Find a player or number" value={q} onChange={(e) => setQ(e.target.value)} inputMode="search" />
        <button onClick={() => setOnly(only === "all" ? "not-available" : "all")} className={`min-h-12 rounded-lg border px-4 text-sm font-semibold ${only === "not-available" ? "border-green-900 bg-green-900 text-white" : "border-neutral-300 bg-white"}`}>
          Not available
        </button>
      </div>
      <ul className="overflow-hidden rounded-xl bg-white shadow-sm">
        {list.map((p) => <Row key={p.id} p={p} today={today} />)}
        {list.length === 0 && <li className="px-3 py-6 text-center text-sm text-neutral-500">No players match.</li>}
      </ul>
    </div>
  );
}
