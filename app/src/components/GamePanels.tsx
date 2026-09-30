"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { saveLinks, setChecklistItem } from "@/app/games/actions";
import type { Game, GameLink } from "@/lib/db-types";
import { CHECKLIST, prepProgress, resultLabel, vsLabel, type ChecklistKey } from "@/lib/games";
import { prettyDate } from "@/lib/time";
import { GameForm } from "./GameForm";
import { PageHeader } from "./PageHeader";
import { btnDanger, btnOutline, btnPlain, btnPrimary, inputCls } from "./ui";

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
        <Link href="/games" className={btnOutline}>All games</Link>
        <button className={btnPrimary} onClick={() => setEditing(!editing)}>{editing ? "Close" : "Edit"}</button>
      </PageHeader>
      {editing && (
        <section className="space-y-3 rounded-xl bg-white p-4 shadow-sm">
          <h2>Edit game</h2>
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
    <section className="space-y-2 rounded-xl bg-white p-4 shadow-sm">
      <div className="flex items-center gap-3"><h2>Game prep</h2><span className="ml-auto text-sm font-semibold text-neutral-600">{p.done} of {p.total} ready</span></div>
      <div className="h-2 overflow-hidden rounded-full bg-neutral-200"><div className="h-full bg-green-900 transition-all" style={{ width: `${(p.done / p.total) * 100}%` }} /></div>
      <ul>
        {CHECKLIST.map((c) => (
          <li key={c.key}>
            <button onClick={() => toggle(c.key)} disabled={pending} aria-pressed={!!checked[c.key]} className="flex min-h-12 w-full items-center gap-3 text-left">
              <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 text-sm font-bold ${checked[c.key] ? "border-green-900 bg-green-900 text-white" : "border-neutral-400 bg-white"}`}>{checked[c.key] ? "✓" : ""}</span>
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
  const [links, setLinks] = useState(initial);
  const [label, setLabel] = useState("");
  const [url, setUrl] = useState("");
  const [error, setError] = useState("");
  const [pending, start] = useTransition();

  const commit = (next: GameLink[], after?: () => void) =>
    start(async () => {
      const r = await saveLinks(gameId, next);
      if (r.error) setError(r.error); else { setError(""); setLinks(next); after?.(); }
    });

  return (
    <section className="space-y-3 rounded-xl bg-white p-4 shadow-sm">
      <div className="flex items-center gap-3"><h2>Film & links</h2><span className="ml-auto text-sm text-neutral-600">Hudl, Drive, scouting reports</span></div>
      {links.length === 0 ? (
        <p className="text-sm text-neutral-600">Paste a Hudl playlist or a Drive link and it will open right from here.</p>
      ) : (
        <ul className="divide-y divide-neutral-200">
          {links.map((l, i) => (
            <li key={`${l.url}-${i}`} className="flex items-center gap-2">
              <a href={l.url} target="_blank" rel="noopener noreferrer" className="flex min-h-12 min-w-0 flex-1 items-center gap-2 font-medium text-green-600 underline">
                <span className="truncate">{l.label}</span><span aria-hidden className="text-xs">↗</span>
              </a>
              <button className={btnDanger} disabled={pending} aria-label={`Remove ${l.label}`} onClick={() => commit(links.filter((_, j) => j !== i))}>Remove</button>
            </li>
          ))}
        </ul>
      )}
      <div className="grid gap-2 sm:grid-cols-[1fr_2fr_auto]">
        <input className={`${inputCls} mt-0`} value={label} onChange={(e) => setLabel(e.target.value)} placeholder="Name (optional)" aria-label="Link name" />
        <input className={`${inputCls} mt-0`} value={url} onChange={(e) => setUrl(e.target.value)} placeholder="Paste a link" aria-label="Link address" inputMode="url" autoCapitalize="none" />
        <button className={btnPlain} disabled={pending || !url.trim()} onClick={() => commit([...links, { label, url }], () => { setLabel(""); setUrl(""); })}>Add link</button>
      </div>
      {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
    </section>
  );
}
