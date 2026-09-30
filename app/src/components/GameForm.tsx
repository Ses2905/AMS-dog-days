"use client";

import { useState, useTransition } from "react";
import { createGame, deleteGame, updateGame } from "@/app/games/actions";
import type { Game } from "@/lib/db-types";
import { LEVELS } from "@/lib/games";
import { btnDanger, btnPlain, btnPrimary, inputCls } from "./ui";

/** Add a game (game = undefined) or edit one. */
export function GameForm({ game, defaultDate, onDone }: { game?: Game; defaultDate?: string; onDone: () => void }) {
  const [date, setDate] = useState(game?.date ?? defaultDate ?? "");
  const [time, setTime] = useState(game?.time ?? "");
  const [opponent, setOpponent] = useState(game?.opponent ?? "");
  const [level, setLevel] = useState<string>(game?.level ?? "jr");
  const [site, setSite] = useState<string>(game?.site ?? "home");
  const [location, setLocation] = useState(game?.location ?? "");
  const [kind, setKind] = useState<string>(game?.kind ?? "game");
  const [status, setStatus] = useState<string>(game?.status ?? "scheduled");
  const [scoreUs, setScoreUs] = useState(game?.scoreUs?.toString() ?? "");
  const [scoreThem, setScoreThem] = useState(game?.scoreThem?.toString() ?? "");
  const [error, setError] = useState("");
  const [pending, start] = useTransition();

  const save = () => start(async () => {
    const payload = { date, time, level, opponent, site, location, kind, status, scoreUs, scoreThem };
    const r = game ? await updateGame(game.id, payload) : await createGame(payload);
    if (r.error) setError(r.error); else { setError(""); onDone(); }
  });
  const remove = () => {
    if (game && window.confirm(`Delete the game vs ${game.opponent}? Notes about it stay, just unlinked. This can't be undone.`))
      start(async () => { const r = await deleteGame(game.id); if (r?.error) setError(r.error); });
  };

  return (
    <div className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="text-sm font-medium">Opponent<input className={inputCls} value={opponent} onChange={(e) => setOpponent(e.target.value)} autoFocus={!game} placeholder="Pea Ridge" /></label>
        <label className="text-sm font-medium">Date<input type="date" className={inputCls} value={date} onChange={(e) => setDate(e.target.value)} /></label>
        <label className="text-sm font-medium">Time (optional)<input className={inputCls} value={time} onChange={(e) => setTime(e.target.value)} placeholder="7:00 PM" /></label>
        <label className="text-sm font-medium">Team
          <select className={inputCls} value={level} onChange={(e) => setLevel(e.target.value)}>{LEVELS.map((l) => <option key={l.value} value={l.value}>{l.label}</option>)}</select>
        </label>
        <label className="text-sm font-medium">Where
          <select className={inputCls} value={site} onChange={(e) => setSite(e.target.value)}><option value="home">Home</option><option value="away">Away</option><option value="neutral">Neutral</option></select>
        </label>
        <label className="text-sm font-medium">Field or town (optional)<input className={inputCls} value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Southside" /></label>
        <label className="text-sm font-medium">Type
          <select className={inputCls} value={kind} onChange={(e) => setKind(e.target.value)}><option value="game">Game</option><option value="scrimmage">Scrimmage</option><option value="other">Other</option></select>
        </label>
        <label className="text-sm font-medium">Status
          <select className={inputCls} value={status} onChange={(e) => setStatus(e.target.value)}><option value="scheduled">Scheduled</option><option value="final">Final</option><option value="postponed">Postponed</option><option value="cancelled">Cancelled</option></select>
        </label>
        {status === "final" && (
          <div className="grid grid-cols-2 gap-3">
            <label className="text-sm font-medium">Alma<input className={inputCls} value={scoreUs} onChange={(e) => setScoreUs(e.target.value)} inputMode="numeric" /></label>
            <label className="text-sm font-medium">{opponent.trim() || "Them"}<input className={inputCls} value={scoreThem} onChange={(e) => setScoreThem(e.target.value)} inputMode="numeric" /></label>
          </div>
        )}
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <p role="alert" className="min-w-0 flex-1 text-sm text-red-700">{error}</p>
        {game && <button className={btnDanger} disabled={pending} onClick={remove}>Delete</button>}
        <button className={btnPlain} onClick={onDone}>Cancel</button>
        <button className={`${btnPrimary} px-6`} disabled={pending} onClick={save}>{pending ? "Saving…" : game ? "Save" : "Add game"}</button>
      </div>
    </div>
  );
}
