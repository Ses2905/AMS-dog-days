"use client";

import Link from "next/link";
import { useState, useTransition, type ReactNode } from "react";
import { setPlayerStatus } from "@/app/roster/actions";
import { STATUSES, STATUS_LABEL, statusOn, type Status } from "@/lib/availability";
import { filterPlayers, NO_PLAYER_FILTERS, sortPlayers, type PlayerFilters, type PlayerSort } from "@/lib/lists";
import { prettyDate } from "@/lib/time";
import type { Player } from "@/lib/types";
import { ListToolbar } from "./ListToolbar";
import { PageHeader } from "./PageHeader";
import { PlayerForm } from "./PlayerForm";
import { btnOutline, btnPrimary } from "./ui";

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
        <span className="font-display w-9 text-lg font-semibold tabular-nums text-neutral-500">{p.number}</span>
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
          <div className="flex flex-wrap items-center gap-2">
            <p role="alert" className="min-w-0 flex-1 text-sm text-red-700">{error}</p>
            <Link href={`/roster/${p.id}/edit`} className="inline-flex min-h-12 items-center rounded-lg border border-neutral-300 bg-white px-4 text-sm font-medium">Edit details</Link>
            <button onClick={() => setOpen(false)} className="min-h-12 rounded-lg border border-neutral-300 bg-white px-4 text-sm font-medium">Cancel</button>
            <button onClick={save} disabled={pending} className="min-h-12 rounded-lg bg-green-900 px-6 font-semibold text-white disabled:opacity-60">{pending ? "Saving…" : "Save"}</button>
          </div>
        </div>
      )}
    </li>
  );
}

const SORTS: { value: PlayerSort; label: string }[] = [
  { value: "number", label: "Number" }, { value: "last", label: "Last name" }, { value: "first", label: "First name" },
  { value: "grade", label: "Grade" }, { value: "status", label: "Availability" },
];

/** The whole Team page below the top bar: header, add panel, extra notices (children), filters and the list. */
export function TeamView({ players, today, children }: { players: Player[]; today: string; children?: ReactNode }) {
  const [filters, setFilters] = useState<PlayerFilters>(NO_PLAYER_FILTERS);
  const [sort, setSort] = useState<PlayerSort>("number");
  const [adding, setAdding] = useState(false);
  const list = sortPlayers(filterPlayers(players, filters, today), sort, today);
  const set = <K extends keyof PlayerFilters>(k: K, v: PlayerFilters[K]) => setFilters((f) => ({ ...f, [k]: v }));
  const filtered = JSON.stringify(filters) !== JSON.stringify(NO_PLAYER_FILTERS);

  return (
    <div className="space-y-4">
      <PageHeader title={`Team · ${players.length} players`}>
        <Link href="/coaches" className={btnOutline}>Coaches</Link>
        <button className={btnPrimary} onClick={() => setAdding(!adding)}>{adding ? "Close" : "Add player"}</button>
      </PageHeader>

      {adding && (
        <section className="space-y-3 rounded-xl bg-white p-4 shadow-sm">
          <h2>Add a player</h2>
          <PlayerForm players={players} onDone={() => setAdding(false)} />
        </section>
      )}

      {children}

      <ListToolbar
        search={filters.q} onSearch={(v) => set("q", v)} placeholder="Find a player or number"
        sort={{ value: sort, options: SORTS, onChange: (v) => setSort(v as PlayerSort) }}
        filters={[
          { label: "Grade", value: filters.grade, onChange: (v) => set("grade", v as PlayerFilters["grade"]), options: [{ value: "all", label: "All" }, { value: "8", label: "8th" }, { value: "9", label: "9th" }] },
          { label: "Status", value: filters.status, onChange: (v) => set("status", v as PlayerFilters["status"]), options: [{ value: "all", label: "All" }, { value: "not-available", label: "Not available" }, { value: "out", label: "Out" }, { value: "limited", label: "Limited" }, { value: "excused", label: "Excused" }] },
          { label: "Check", value: filters.review ? "review" : "all", onChange: (v) => set("review", v === "review"), options: [{ value: "all", label: "All" }, { value: "review", label: "Number to confirm" }] },
        ]}
        summary={`Showing ${list.length} of ${players.length}`} canReset={filtered} onReset={() => setFilters(NO_PLAYER_FILTERS)}
      />

      <ul className="overflow-hidden rounded-xl bg-white shadow-sm">
        {list.map((p) => <Row key={p.id} p={p} today={today} />)}
        {list.length === 0 && <li className="px-3 py-6 text-center text-sm text-neutral-500">No players match.</li>}
      </ul>
    </div>
  );
}
