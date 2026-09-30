"use client";

import Link from "next/link";
import { useState } from "react";
import type { Game } from "@/lib/db-types";
import { CHECKLIST, LEVELS, levelLabel, prepProgress, resultLabel, vsLabel } from "@/lib/games";
import { prettyDate } from "@/lib/time";
import { GameForm } from "./GameForm";
import { ListToolbar } from "./ListToolbar";
import { PageHeader } from "./PageHeader";
import { Row } from "./Row";
import { btnOutline, btnPrimary } from "./ui";
import { Icon } from "./Icon";
import { Pill } from "./Pill";

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
        <Link href="/calendar?show=game" className={btnOutline}><Icon name="calendar" />Calendar</Link>
        <button className={btnPrimary} onClick={() => setAdding(!adding)}>{adding ? <><Icon name="x" />Close</> : <><Icon name="plus" />Add Game</>}</button>
      </PageHeader>

      {adding && (
        <section className="space-y-3 rounded-2xl bg-white p-5 shadow-sm">
          <h2>Add a Game</h2>
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

      <ul className="divide-y divide-neutral-200 overflow-hidden rounded-2xl bg-white shadow-sm">
        {list.map((g) => {
          const p = prepProgress(g.checklist);
          const res = resultLabel(g);
          // Jordan covers every level, so flag nights with more than one game.
          const sameNight = games.filter((o) => o.id !== g.id && o.date === g.date && o.status !== "cancelled");
          return (
            <li key={g.id}>
              <Row
                href={`/games/${g.id}`} lead={<><span className="block text-xs font-semibold uppercase tracking-wide text-neutral-500">{prettyDate(g.date).split(",")[0]}</span>{prettyDate(g.date).split(", ")[1]}</>}
                title={vsLabel(g)}
                meta={[levelLabel(g.level), g.time, g.location, g.kind !== "game" && g.kind, sameNight.length > 0 && `Same night: ${sameNight.map((o) => levelLabel(o.level)).join(", ")}`].filter(Boolean).join(" · ")}
                status={res ? <Pill tone={res.startsWith("W") ? "green" : res.startsWith("L") ? "red" : "grey"}>{res}</Pill> : g.date >= today ? <Pill tone={p.done === p.total ? "green" : "grey"}>Prep {p.done}/{p.total}</Pill> : undefined}
              />
            </li>
          );
        })}
        {list.length === 0 && <li className="px-4 py-6 text-center text-sm text-neutral-500">{games.length === 0 ? `Add your first game to start a prep page for it. Prep covers: ${CHECKLIST.map((c) => c.label.replace(/ (done|reviewed)$/, "").toLowerCase()).join(", ")}.` : "No games match."}</li>}
      </ul>
    </div>
  );
}
