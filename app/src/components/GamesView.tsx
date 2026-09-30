"use client";

import Link from "next/link";
import { useState } from "react";
import type { Game } from "@/lib/db-types";
import { CHECKLIST, LEVELS, levelLabel, prepProgress, resultLabel, vsLabel } from "@/lib/games";
import { prettyDate } from "@/lib/time";
import { GameForm } from "./GameForm";
import { ListToolbar } from "./ListToolbar";
import { PageHeader } from "./PageHeader";
import { btnPrimary } from "./ui";

type Filters = { q: string; when: "all" | "upcoming" | "past"; site: "all" | "home" | "away"; level: "all" | "jr" | "jrjv" | "jv" | "varsity" };
const NONE: Filters = { q: "", when: "upcoming", site: "all", level: "all" };

export function GamesView({ games, today }: { games: Game[]; today: string }) {
  const [filters, setFilters] = useState<Filters>(NONE);
  const [sort, setSort] = useState<"soonest" | "latest">("soonest");
  const [adding, setAdding] = useState(false);
  const q = filters.q.trim().toLowerCase();
  const list = games
    .filter((g) => (filters.when === "upcoming" ? g.date >= today : filters.when === "past" ? g.date < today : true))
    .filter((g) => filters.site === "all" || g.site === filters.site)
    .filter((g) => filters.level === "all" || g.level === filters.level)
    .filter((g) => !q || `${g.opponent} ${g.location ?? ""} ${g.kind}`.toLowerCase().includes(q))
    .sort((a, b) => (sort === "soonest" ? 1 : -1) * a.date.localeCompare(b.date));
  const upcoming = games.filter((g) => g.date >= today && g.status === "scheduled").length;

  return (
    <div className="space-y-4">
      <PageHeader title={`Games · ${games.length}`} subtitle={upcoming > 0 ? `${upcoming} coming up` : "Nothing scheduled yet"}>
        <button className={btnPrimary} onClick={() => setAdding(!adding)}>{adding ? "Close" : "Add game"}</button>
      </PageHeader>

      {adding && (
        <section className="space-y-3 rounded-xl bg-white p-4 shadow-sm">
          <h2>Add a game</h2>
          <GameForm defaultDate={today} onDone={() => setAdding(false)} />
        </section>
      )}

      <ListToolbar
        search={filters.q} onSearch={(v) => setFilters((f) => ({ ...f, q: v }))} placeholder="Find an opponent"
        sort={{ value: sort, options: [{ value: "soonest", label: "Soonest first" }, { value: "latest", label: "Latest first" }], onChange: (v) => setSort(v as "soonest" | "latest") }}
        filters={[
          { label: "When", value: filters.when, onChange: (v) => setFilters((f) => ({ ...f, when: v as Filters["when"] })), options: [{ value: "upcoming", label: "Upcoming" }, { value: "past", label: "Past" }, { value: "all", label: "All" }] },
          { label: "Team", value: filters.level, onChange: (v) => setFilters((f) => ({ ...f, level: v as Filters["level"] })), options: [{ value: "all", label: "All" }, ...LEVELS.map((l) => ({ value: l.value, label: l.label }))] },
          { label: "Where", value: filters.site, onChange: (v) => setFilters((f) => ({ ...f, site: v as Filters["site"] })), options: [{ value: "all", label: "All" }, { value: "home", label: "Home" }, { value: "away", label: "Away" }] },
        ]}
        summary={`Showing ${list.length} of ${games.length}`} canReset={JSON.stringify(filters) !== JSON.stringify(NONE)} onReset={() => setFilters(NONE)}
      />

      <ul className="overflow-hidden rounded-xl bg-white shadow-sm">
        {list.map((g) => {
          const p = prepProgress(g.checklist);
          const res = resultLabel(g);
          // Jordan covers every level, so flag nights with more than one game.
          const sameNight = games.filter((o) => o.id !== g.id && o.date === g.date && o.status !== "cancelled");
          return (
            <li key={g.id} className="border-b border-neutral-200 last:border-0">
              <Link href={`/games/${g.id}`} className="flex min-h-16 items-center gap-3 px-4 py-3 hover:bg-wash">
                <span className="min-w-0 flex-1">
                  <span className="font-display flex flex-wrap items-center gap-2 text-xl font-semibold uppercase tracking-wide">{vsLabel(g)}<span className="rounded-full bg-neutral-200 px-2 py-0.5 font-sans text-xs font-semibold normal-case tracking-normal text-neutral-700">{levelLabel(g.level)}</span></span>
                  <span className="block text-sm text-neutral-600">{prettyDate(g.date)}{g.time ? ` · ${g.time}` : ""}{g.location ? ` · ${g.location}` : ""}{g.kind !== "game" ? ` · ${g.kind}` : ""}</span>
                  {sameNight.length > 0 && <span className="mt-1 block text-xs font-semibold text-[#6b5b12]">Same night: {sameNight.map((o) => `${levelLabel(o.level)}${o.time ? ` ${o.time}` : ""}`).join(", ")}</span>}
                </span>
                {res ? (
                  <span className={`rounded-full px-3 py-1 text-xs font-semibold ${res.startsWith("W") ? "bg-green-600/10 text-green-900" : res.startsWith("L") ? "bg-red-100 text-red-800" : "bg-neutral-200 text-neutral-700"}`}>{res}</span>
                ) : (
                  <span className={`rounded-full px-3 py-1 text-xs font-semibold ${p.done === p.total ? "bg-green-600/10 text-green-900" : "bg-neutral-200 text-neutral-800"}`}>Prep {p.done}/{p.total}</span>
                )}
              </Link>
            </li>
          );
        })}
        {list.length === 0 && <li className="px-4 py-6 text-center text-sm text-neutral-500">{games.length === 0 ? `Add your first game to start a prep page for it. Prep covers: ${CHECKLIST.map((c) => c.label.replace(/ (done|reviewed)$/, "").toLowerCase()).join(", ")}.` : "No games match."}</li>}
      </ul>
    </div>
  );
}
