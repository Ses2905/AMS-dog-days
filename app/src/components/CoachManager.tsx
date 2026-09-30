"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { deleteCoach, saveCoach } from "@/app/roster/admin-actions";
import type { Coach } from "@/lib/db-types";
import { filterCoaches, NO_COACH_FILTERS, sortCoaches, type CoachFilters, type CoachSort } from "@/lib/lists";
import { ListToolbar } from "./ListToolbar";
import { PageHeader } from "./PageHeader";
import { btnDanger, btnOutline, btnPlain, btnPrimary } from "./ui";
import { Icon } from "./Icon";
import { Pill } from "./Pill";

const input = "min-h-12 w-full rounded-lg border border-neutral-300 bg-white px-3 text-base";

/** Edit form for one coach, or (coach = null) the "Add a coach" panel. */
function CoachForm({ coach, onDone }: { coach: Coach | null; onDone: () => void }) {
  const [first, setFirst] = useState(coach?.first ?? "");
  const [last, setLast] = useState(coach?.last ?? "");
  const [role, setRole] = useState(coach?.role ?? "Coach");
  const [active, setActive] = useState(coach?.active ?? true);
  const [error, setError] = useState("");
  const [pending, start] = useTransition();
  const run = (fn: () => Promise<{ error: string }>) => start(async () => { const r = await fn(); if (r.error) setError(r.error); else { setError(""); onDone(); } });

  return (
    <div className="space-y-3">
      <div className="grid gap-2 sm:grid-cols-3">
        <label className="text-sm font-medium">First Name (optional)<input className={input} value={first} onChange={(e) => setFirst(e.target.value)} /></label>
        <label className="text-sm font-medium">Last Name<input className={input} value={last} onChange={(e) => setLast(e.target.value)} /></label>
        <label className="text-sm font-medium">Role<input className={input} value={role} onChange={(e) => setRole(e.target.value)} placeholder="e.g. Head Coach, Defensive Line…" /></label>
      </div>
      <label className="flex items-center gap-3 text-sm"><input type="checkbox" className="h-5 w-5" checked={active} onChange={(e) => setActive(e.target.checked)} />Coaching this season (shows up as a suggestion when planning)</label>
      <div className="flex flex-wrap items-center gap-2">
        <p role="alert" className="min-w-0 flex-1 text-sm text-red-700">{error}</p>
        {coach && <button className={btnDanger} disabled={pending} onClick={() => { if (window.confirm(`Remove ${coach.last} from the coach list? Past practices keep their name.`)) run(() => deleteCoach(coach.id)); }}>Remove</button>}
        <button className={btnPlain} onClick={onDone}>Cancel</button>
        <button className={btnPrimary} disabled={pending} onClick={() => run(() => saveCoach(coach?.id ?? null, { first, last, role, active }))}>{pending ? "Saving…" : coach ? <><Icon name="check" />Save</> : <><Icon name="plus" />Add Coach</>}</button>
      </div>
    </div>
  );
}

function Row({ coach }: { coach: Coach }) {
  const [open, setOpen] = useState(false);
  return (
    <li>
      <button className="flex min-h-14 w-full items-center gap-3 px-3 py-2 text-left hover:bg-wash" aria-expanded={open} onClick={() => setOpen(!open)}>
        <span className="min-w-0 flex-1"><span className="font-medium">{coach.first ? `${coach.first} ` : ""}{coach.last}</span><span className="block text-sm text-neutral-500">{coach.role}</span></span>
        {!coach.active && <Pill>Inactive</Pill>}
      </button>
      {open && <div className="bg-wash px-3 py-3"><CoachForm coach={coach} onDone={() => setOpen(false)} /></div>}
    </li>
  );
}

const SORTS: { value: CoachSort; label: string }[] = [{ value: "order", label: "Saved order" }, { value: "last", label: "Last name" }, { value: "role", label: "Role" }];

export function CoachesView({ coaches }: { coaches: Coach[] }) {
  const [filters, setFilters] = useState<CoachFilters>(NO_COACH_FILTERS);
  const [sort, setSort] = useState<CoachSort>("order");
  const [adding, setAdding] = useState(false);
  const list = sortCoaches(filterCoaches(coaches, filters), sort);
  const filtered = JSON.stringify(filters) !== JSON.stringify(NO_COACH_FILTERS);

  return (
    <div className="space-y-4">
      <PageHeader title={`Coaches · ${coaches.length}`} subtitle="The last names here become the columns on a practice plan. Tap a coach to edit.">
        <Link href="/roster" className={btnOutline}>Team</Link>
        <button className={btnPrimary} onClick={() => setAdding(!adding)}>{adding ? <><Icon name="x" />Close</> : <><Icon name="plus" />Add Coach</>}</button>
      </PageHeader>

      {adding && (
        <section className="space-y-3 rounded-2xl bg-white p-5 shadow-sm">
          <h2>Add a Coach</h2>
          <CoachForm coach={null} onDone={() => setAdding(false)} />
        </section>
      )}

      <ListToolbar
        search={filters.q} onSearch={(v) => setFilters((f) => ({ ...f, q: v }))} placeholder="Find a coach or role"
        sort={{ value: sort, options: SORTS, onChange: (v) => setSort(v as CoachSort) }}
        filters={[{ label: "Season", value: filters.active, onChange: (v) => setFilters((f) => ({ ...f, active: v as CoachFilters["active"] })), options: [{ value: "all", label: "All" }, { value: "active", label: "Active" }, { value: "inactive", label: "Inactive" }] }]}
        summary={`Showing ${list.length} of ${coaches.length}`} canReset={filtered} onReset={() => setFilters(NO_COACH_FILTERS)}
      />

      <ul className="divide-y divide-neutral-200 overflow-hidden rounded-2xl bg-white shadow-sm">
        {list.map((c) => <Row key={c.id} coach={c} />)}
        {list.length === 0 && <li className="px-3 py-6 text-center text-sm text-neutral-500">No coaches match.</li>}
      </ul>
    </div>
  );
}
