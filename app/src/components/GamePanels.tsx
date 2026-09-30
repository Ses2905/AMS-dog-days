"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { saveLinks, setChecklistItem } from "@/app/games/actions";
import type { Game, GameLink } from "@/lib/db-types";
import { CHECKLIST, prepProgress, resultLabel, vsLabel, type ChecklistKey } from "@/lib/games";
import { prettyDate } from "@/lib/time";
import { GameForm } from "./GameForm";
import { LinksEditor } from "./LinksEditor";
import { PageHeader } from "./PageHeader";
import { btnOutline, btnPrimary } from "./ui";
import { Icon } from "./Icon";

/** Title, date and place, with an Edit panel. */
export function GameHeader({ game }: { game: Game }) {
  const [editing, setEditing] = useState(false);
  const res = resultLabel(game);
  return (
    <div className="space-y-4">
      <PageHeader
        title={vsLabel(game)}
        subtitle={`${prettyDate(game.date)}${game.time ? ` · ${game.time}` : ""}${game.location ? ` · ${game.location}` : ""}${game.kind !== "game" ? ` · ${game.kind}` : ""}${res ? ` · ${res}` : ""}`}
      >
        <Link href="/games" className={btnOutline}><Icon name="arrow-left" />All Games</Link>
        <button className={btnPrimary} onClick={() => setEditing(!editing)}>{editing ? <><Icon name="x" />Close</> : <><Icon name="pencil" />Edit</>}</button>
      </PageHeader>
      {editing && (
        <section className="space-y-3 rounded-2xl bg-white p-5 shadow-sm">
          <h2>Edit Game</h2>
          <GameForm game={game} onDone={() => setEditing(false)} />
        </section>
      )}
    </div>
  );
}

export function GameChecklist({ gameId, initial }: { gameId: string; initial: Record<string, boolean> }) {
  const [checked, setChecked] = useState(initial);
  const [error, setError] = useState("");
  const [pending, start] = useTransition();
  const p = prepProgress(checked);
  const toggle = (key: ChecklistKey) => {
    const value = !checked[key];
    setChecked((c) => ({ ...c, [key]: value })); // show the change right away
    start(async () => {
      const r = await setChecklistItem(gameId, key, value);
      if (r.error) { setChecked((c) => ({ ...c, [key]: !value })); setError(r.error); } else setError("");
    });
  };
  return (
    <section className="space-y-2 rounded-2xl bg-white p-5 shadow-sm">
      <div className="flex items-center gap-3"><h2>Game Prep</h2><span className="ml-auto text-sm font-semibold text-neutral-600">{p.done} of {p.total} ready</span></div>
      <div className="h-2 overflow-hidden rounded-full bg-neutral-200"><div className="h-full bg-green-900 transition-all" style={{ width: `${(p.done / p.total) * 100}%` }} /></div>
      <ul>
        {CHECKLIST.map((c) => (
          <li key={c.key}>
            <button onClick={() => toggle(c.key)} disabled={pending} aria-pressed={!!checked[c.key]} className="flex min-h-12 w-full items-center gap-3 text-left">
              <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 text-sm font-bold ${checked[c.key] ? "border-green-900 bg-green-900 text-white" : "border-neutral-400 bg-white"}`}>{checked[c.key] ? <Icon name="check" size={16} /> : null}</span>
              <span className={checked[c.key] ? "text-neutral-500 line-through" : ""}>{c.label}</span>
            </button>
          </li>
        ))}
      </ul>
      {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
    </section>
  );
}

export function GameLinks({ gameId, initial }: { gameId: string; initial: GameLink[] }) {
  return <LinksEditor initial={initial} save={(links) => saveLinks(gameId, links)} title="Film & Links" hint="Hudl, Drive, scouting reports" empty="Paste a Hudl playlist or a Drive link and it will open right from here." />;
}
