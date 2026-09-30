"use client";

import Link from "next/link";
import { useState } from "react";
import type { Player } from "@/lib/types";
import { ListToolbar } from "./ListToolbar";
import { PageHeader } from "./PageHeader";
import { PlayerForm } from "./PlayerForm";
import { btnOutline, btnPrimary } from "./ui";

type Filters = { q: string; grade: "all" | "9" | "10" | "11" | "12"; group: "all" | "off" | "def" | "st" };
const NONE: Filters = { q: "", grade: "all", group: "all" };
type Sort = "number" | "last" | "grade" | "position";

// Position groups by the first letters of the listed position (a WR/CB is both an offense and a defense player).
const OFF = /(QB|RB|WR|TE|OL|FB)/, DEF = /(DL|DE|LB|CB|DB|S\b)/, ST = /(^K|\/K|P\b)/;

/** The high school roster (varsity and JV) with the same search, filter, sort and add pattern as the Jr. High Team page. */
export function HighSchoolRoster({ players }: { players: Player[] }) {
  const [filters, setFilters] = useState<Filters>(NONE);
  const [sort, setSort] = useState<Sort>("number");
  const [adding, setAdding] = useState(false);
  const q = filters.q.trim().toLowerCase();
  const list = players
    .filter((p) => filters.grade === "all" || p.grade === Number(filters.grade))
    .filter((p) => filters.group === "all" || (filters.group === "off" ? OFF.test(p.position ?? "") : filters.group === "def" ? DEF.test(p.position ?? "") : ST.test(p.position ?? "")))
    .filter((p) => !q || `${p.first} ${p.last} ${p.number} ${p.position ?? ""}`.toLowerCase().includes(q))
    .sort((a, b) => sort === "last" ? a.last.localeCompare(b.last) : sort === "grade" ? b.grade - a.grade || a.number - b.number : sort === "position" ? (a.position ?? "~").localeCompare(b.position ?? "~") || a.number - b.number : a.number - b.number);

  return (
    <div className="space-y-4">
      <PageHeader title={`High School · ${players.length} players`} subtitle="Varsity and JV">
        <Link href="/roster" className={btnOutline}>Jr. High team</Link>
        <button className={btnPrimary} onClick={() => setAdding(!adding)}>{adding ? "Close" : "Add player"}</button>
      </PageHeader>
      {adding && (
        <section className="space-y-3 rounded-xl bg-white p-4 shadow-sm">
          <h2>Add a player</h2>
          <PlayerForm players={players} team="hs" onDone={() => setAdding(false)} />
        </section>
      )}
      <ListToolbar
        search={filters.q} onSearch={(v) => setFilters((f) => ({ ...f, q: v }))} placeholder="Find a player, number or position"
        sort={{ value: sort, options: [{ value: "number", label: "Number" }, { value: "last", label: "Last name" }, { value: "grade", label: "Grade" }, { value: "position", label: "Position" }], onChange: (v) => setSort(v as Sort) }}
        filters={[
          { label: "Grade", value: filters.grade, onChange: (v) => setFilters((f) => ({ ...f, grade: v as Filters["grade"] })), options: [{ value: "all", label: "All" }, ...["9", "10", "11", "12"].map((g) => ({ value: g, label: `${g}th` }))] },
          { label: "Group", value: filters.group, onChange: (v) => setFilters((f) => ({ ...f, group: v as Filters["group"] })), options: [{ value: "all", label: "All" }, { value: "off", label: "Offense" }, { value: "def", label: "Defense" }, { value: "st", label: "Kickers" }] },
        ]}
        summary={`Showing ${list.length} of ${players.length}`} canReset={JSON.stringify(filters) !== JSON.stringify(NONE)} onReset={() => setFilters(NONE)}
      />
      <ul className="overflow-hidden rounded-xl bg-white shadow-sm">
        {list.map((p) => (
          <li key={p.id} className="border-b border-neutral-200 last:border-0">
            <Link href={`/roster/${p.id}/edit`} className="flex min-h-14 items-center gap-3 px-4 py-2 hover:bg-wash">
              <span className="font-display w-10 shrink-0 text-2xl font-semibold text-green-900">{p.number}</span>
              <span className="min-w-0 flex-1"><span className="block font-medium">{p.first} {p.last}</span><span className="block text-sm text-neutral-600">{[p.position, `${p.grade}th`, p.height, p.weight && `${p.weight} lb`].filter(Boolean).join(" · ")}</span></span>
              <span aria-hidden className="text-neutral-400">›</span>
            </Link>
          </li>
        ))}
        {list.length === 0 && <li className="px-3 py-6 text-center text-sm text-neutral-500">No players match.</li>}
      </ul>
    </div>
  );
}
