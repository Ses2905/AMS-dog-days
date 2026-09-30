"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { createPlayer, deletePlayer, mergePlayers, updatePlayer } from "@/app/roster/admin-actions";
import { numberClashes } from "@/lib/roster-admin";
import { btnDanger, btnPlain, inputCls } from "./ui";
import type { Player } from "@/lib/types";

const input = inputCls;
const btn = btnPlain;

export function PlayerForm({ player, players, onDone }: { player?: Player; players: Player[]; onDone?: () => void }) {
  const [first, setFirst] = useState(player?.first ?? "");
  const [last, setLast] = useState(player?.last ?? "");
  const [grade, setGrade] = useState<number>(player?.grade ?? 8);
  const [number, setNumber] = useState(player ? String(player.number) : "");
  const [confirmNumber, setConfirmNumber] = useState(false);
  const [mergeWith, setMergeWith] = useState("");
  const [error, setError] = useState("");
  const [pending, start] = useTransition();

  const n = number.trim() === "" ? NaN : Number(number);
  const clashes = Number.isInteger(n) ? numberClashes(players, player?.id ?? null, n) : [];
  const others = players.filter((p) => p.id !== player?.id);
  const run = (fn: () => Promise<{ error: string } | void>) => start(async () => { setError(""); const r = await fn(); if (r?.error) setError(r.error); });

  const save = () => run(() => {
    const payload = { first, last, grade, number, confirmNumber };
    return player ? updatePlayer(player.id, payload) : createPlayer(payload).then((r) => { if (!r.error) onDone?.(); return r; });
  });

  return (
    <div className="space-y-4">
      <div className={player ? "space-y-4 rounded-xl bg-white p-4 shadow-sm" : "space-y-4"}>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="text-sm font-medium">First name<input className={input} value={first} onChange={(e) => setFirst(e.target.value)} autoComplete="off" /></label>
          <label className="text-sm font-medium">Last name<input className={input} value={last} onChange={(e) => setLast(e.target.value)} autoComplete="off" /></label>
          <label className="text-sm font-medium">Grade
            <select className={input} value={grade} onChange={(e) => setGrade(Number(e.target.value))}><option value={8}>8th</option><option value={9}>9th</option></select>
          </label>
          <label className="text-sm font-medium">Jersey number<input className={input} value={number} onChange={(e) => setNumber(e.target.value)} inputMode="numeric" /></label>
        </div>
        {clashes.length > 0 && (
          <p className="rounded-lg bg-[#f8f4e3] p-3 text-sm">#{n} is also worn by {clashes.map((c) => `${c.first} ${c.last}`).join(" and ")}. You can still save if that’s intended.</p>
        )}
        {player && player.otherNumbers.length > 0 && (
          <label className="flex items-start gap-3 rounded-lg bg-wash p-3 text-sm">
            <input type="checkbox" className="mt-1 h-5 w-5" checked={confirmNumber} onChange={(e) => setConfirmNumber(e.target.checked)} />
            <span>This number is right. Clear the “also #{player.otherNumbers.join(", #")}” note that came from the other roster lists.</span>
          </label>
        )}
        <div className="flex flex-wrap items-center gap-3">
          <p role="alert" className="min-w-0 flex-1 text-sm text-red-700">{error}</p>
          {player ? <Link href="/roster" className={btn}>Cancel</Link> : <button className={btn} onClick={onDone}>Cancel</button>}
          <button onClick={save} disabled={pending} className="min-h-12 rounded-lg bg-green-900 px-6 font-semibold text-white disabled:opacity-60">{pending ? "Saving…" : player ? "Save" : "Add player"}</button>
        </div>
      </div>

      {player && (
        <div className="space-y-3 rounded-xl bg-white p-4 shadow-sm">
          <h2>Same kid listed twice?</h2>
          <p className="text-sm text-neutral-600">Keeps {player.first} {player.last} (#{player.number}) and removes the other entry. The other entry’s number is saved as an “also #” note.</p>
          <div className="flex gap-2">
            <select className={`${input} mt-0`} value={mergeWith} onChange={(e) => setMergeWith(e.target.value)}>
              <option value="">Pick the duplicate to remove…</option>
              {others.map((p) => <option key={p.id} value={p.id}>{p.first} {p.last} · #{p.number}</option>)}
            </select>
            <button className={btn} disabled={!mergeWith || pending} onClick={() => {
              const dup = others.find((p) => p.id === mergeWith);
              if (dup && window.confirm(`Remove ${dup.first} ${dup.last} (#${dup.number}) and keep ${player.first} ${player.last}? This can't be undone.`)) run(() => mergePlayers(player.id, mergeWith));
            }}>Merge</button>
          </div>
          <hr className="border-neutral-200" />
          <button className={btnDanger} disabled={pending} onClick={() => {
            if (window.confirm(`Remove ${player.first} ${player.last} from the roster? This can't be undone.`)) run(() => deletePlayer(player.id));
          }}>Remove from roster</button>
        </div>
      )}
    </div>
  );
}
