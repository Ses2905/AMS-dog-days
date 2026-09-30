"use client";

import { useState, useTransition } from "react";
import { addPlay, deletePlay, setFinalFromLog } from "@/app/games/plays-actions";
import type { Game } from "@/lib/db-types";
import { PLAY_TYPES, playLabel, QUARTERS, quarterLabel, totals, type Play } from "@/lib/plays";
import { btnDanger, btnOutline, btnPlain, btnPrimary, inputCls } from "./ui";
import { Icon } from "./Icon";
import { Pill } from "./Pill";

type Roster = { id: string; label: string }[];

/** Scoring log for one game: who scored, how, and when. Totals come from the log. */
export function GameScoring({ game, plays, roster }: { game: Game; plays: Play[]; roster: Roster }) {
  const [team, setTeam] = useState<"us" | "them">("us");
  const [quarter, setQuarter] = useState(1);
  const [type, setType] = useState<string>("touchdown");
  const [playerId, setPlayerId] = useState("");
  const [name, setName] = useState("");
  const [detail, setDetail] = useState("");
  const [error, setError] = useState("");
  const [pending, start] = useTransition();
  const t = totals(plays);
  const matchesFinal = game.status === "final" && game.scoreUs === t.us && game.scoreThem === t.them;
  const label = (p: Play) => (p.playerId ? roster.find((r) => r.id === p.playerId)?.label : p.scorerName) ?? (p.team === "them" ? game.opponent : "Unknown");

  const add = () => start(async () => {
    const r = await addPlay(game.id, { team, quarter, type, playerId, scorerName: name, detail });
    if (r.error) { setError(r.error); return; }
    setError(""); setPlayerId(""); setName(""); setDetail("");
  });
  const remove = (p: Play) => { if (window.confirm("Delete this score?")) start(async () => { const r = await deletePlay(p.id); if (r.error) setError(r.error); }); };
  const finalize = () => start(async () => { const r = await setFinalFromLog(game.id); if (r.error) setError(r.error); else setError(""); });

  return (
    <section className="space-y-3 rounded-xl bg-white p-4 shadow-sm">
      <div className="flex flex-wrap items-center gap-3">
        <h2>Scoring</h2>
        <p className="font-display text-3xl font-semibold tabular-nums">Alma {t.us} <span className="text-neutral-400">–</span> {t.them} {game.opponent}</p>
        {plays.length > 0 && !matchesFinal && <button className={`${btnOutline} ml-auto`} disabled={pending} onClick={finalize}>Set as Final Score</button>}
        {matchesFinal && <Pill tone="solid" className="ml-auto">Final</Pill>}
      </div>

      {plays.length === 0 ? <p className="text-sm text-neutral-600">Log each score as it happens, or after the game from the film. Season leaders build from these.</p> : (
        <ul className="divide-y divide-neutral-200">
          {plays.map((p) => (
            <li key={p.id} className="flex items-center gap-2 py-2">
              <span className="w-10 shrink-0 font-display text-lg font-semibold text-neutral-500">{quarterLabel(p.quarter)}</span>
              <span className="min-w-0 flex-1"><span className="font-medium">{p.team === "us" ? "" : "Opp. · "}{label(p)}</span> <span className="text-sm text-neutral-700">{playLabel(p.type)} (+{p.points})</span>{p.detail && <span className="block text-sm text-neutral-600">{p.detail}</span>}</span>
              <button className={btnDanger} disabled={pending} aria-label="Delete score" onClick={() => remove(p)}>Delete</button>
            </li>
          ))}
        </ul>
      )}

      <div className="space-y-2 rounded-lg bg-wash p-3">
        <div className="flex overflow-hidden rounded-lg border border-neutral-300 text-sm font-semibold">
          {([["us", "Alma"], ["them", game.opponent]] as const).map(([v, l]) => (
            <button key={v} aria-pressed={team === v} onClick={() => setTeam(v)} className={`min-h-12 flex-1 truncate px-3 ${team === v ? "bg-green-900 text-white" : "bg-white"}`}>{l}</button>
          ))}
        </div>
        <div className="grid gap-2 sm:grid-cols-2">
          <label className="text-sm font-medium">Quarter<select className={inputCls} value={quarter} onChange={(e) => setQuarter(Number(e.target.value))}>{QUARTERS.map((q) => <option key={q} value={q}>{q === 5 ? "Overtime" : `Quarter ${q}`}</option>)}</select></label>
          <label className="text-sm font-medium">What<select className={inputCls} value={type} onChange={(e) => setType(e.target.value)}>{PLAY_TYPES.map((p) => <option key={p.value} value={p.value}>{p.label} (+{p.points})</option>)}</select></label>
          {team === "us" && (
            <label className="text-sm font-medium">Who Scored<select className={inputCls} value={playerId} onChange={(e) => setPlayerId(e.target.value)}><option value="">Not on the roster</option>{roster.map((r) => <option key={r.id} value={r.id}>{r.label}</option>)}</select></label>
          )}
          {(team === "them" || !playerId) && (
            <label className="text-sm font-medium">{team === "us" ? "Name (if not on the roster)" : "Name (optional)"}<input className={inputCls} value={name} onChange={(e) => setName(e.target.value)} maxLength={60} placeholder={team === "us" ? "e.g. JV #22 Smith" : "#5"} /></label>
          )}
          <label className="text-sm font-medium sm:col-span-2">Details (optional)<input className={inputCls} value={detail} onChange={(e) => setDetail(e.target.value)} maxLength={200} placeholder="e.g. 35-yard pass from #7" /></label>
        </div>
        <div className="flex items-center gap-2">
          <p role="alert" className="min-w-0 flex-1 text-sm text-red-700">{error}</p>
          <button className={btnPlain} disabled={pending} onClick={() => { setTeam("us"); setQuarter(1); setType("touchdown"); setPlayerId(""); setName(""); setDetail(""); }}>Reset</button>
          <button className={btnPrimary} disabled={pending} onClick={add}>{pending ? "Saving…" : <><Icon name="plus" />Add Score</>}</button>
        </div>
      </div>
    </section>
  );
}
