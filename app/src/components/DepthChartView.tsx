"use client";

import { useState, useTransition } from "react";
import { addPlayerToPosition, addPosition, deletePosition, movePlayer, removePlayerFromPosition, updatePosition } from "@/app/depth/actions";
import { analyze, DEPTH_LABEL, UNITS, type DepthPosition, type DepthSlot, type Row, type Unit } from "@/lib/depth";
import type { Player } from "@/lib/types";
import { PageHeader } from "./PageHeader";
import { btnDanger, btnOutline, btnPlain, btnPrimary, inputCls } from "./ui";

const ORD = ["1st", "2nd", "3rd", "4th", "5th", "6th", "7th", "8th"];
const DEPTH_CHIP: Record<Row["depth"], string> = { short: "bg-red-100 text-red-800", thin: "bg-[#f6efc9] text-[#5b4d0b]", ok: "bg-green-900/10 text-green-900" };

function PositionCard({ row, players, ideas, editing }: { row: Row; players: Player[]; ideas: Record<string, string[]>; editing: boolean }) {
  const [pick, setPick] = useState("");
  const [name, setName] = useState(row.position.name);
  const [starters, setStarters] = useState(String(row.position.starters));
  const [error, setError] = useState("");
  const [pending, start] = useTransition();
  const run = (fn: () => Promise<{ error: string }>, after?: () => void) => start(async () => { const r = await fn(); if (r.error) setError(r.error); else { setError(""); after?.(); } });
  const inChart = new Set(row.players.map((x) => x.player.id));
  const options = players.filter((p) => !inChart.has(p.id)).sort((a, b) => a.number - b.number);
  const p = row.position;

  return (
    <section className="space-y-2 rounded-xl bg-white p-4 shadow-sm">
      <div className="flex flex-wrap items-center gap-2">
        <h2>{p.name}</h2>
        <span className="text-sm text-neutral-600">{p.starters} starter{p.starters === 1 ? "" : "s"}</span>
        <span className={`ml-auto rounded-full px-3 py-0.5 text-xs font-bold ${DEPTH_CHIP[row.depth]}`}>{DEPTH_LABEL[row.depth]}</span>
      </div>
      {editing && (
        <div className="grid gap-2 rounded-lg bg-wash p-3 sm:grid-cols-[1fr_auto_auto_auto]">
          <input className={`${inputCls} mt-0`} value={name} maxLength={30} onChange={(e) => setName(e.target.value)} aria-label="Position name" />
          <input className={`${inputCls} mt-0 sm:w-24`} type="number" min={1} max={11} value={starters} onChange={(e) => setStarters(e.target.value)} aria-label="Starters" />
          <button className={btnPlain} disabled={pending} onClick={() => run(() => updatePosition(p.id, { unit: p.unit, name, starters }))}>Save</button>
          <button className={btnDanger} disabled={pending} onClick={() => { if (window.confirm(`Delete ${p.name} and everyone listed under it?`)) run(() => deletePosition(p.id)); }}>Delete</button>
        </div>
      )}
      {row.players.length === 0 ? <p className="text-sm text-neutral-600">Nobody listed yet.</p> : (
        <ol className="divide-y divide-neutral-200">
          {row.players.map(({ player, rank, unavailable, alsoAt }) => (
            <li key={player.id} className={`flex flex-wrap items-center gap-2 py-2 ${rank > p.starters ? "text-neutral-700" : ""}`}>
              <span className="font-display w-10 shrink-0 text-lg font-semibold text-neutral-500">{ORD[rank - 1] ?? `${rank}th`}</span>
              <span className="min-w-0 flex-1">
                <span className="font-display text-xl font-semibold">#{player.number}</span> <span className="font-medium">{player.first} {player.last}</span> <span className="text-xs text-neutral-500">{player.grade}th</span>
                {unavailable && <span className="ml-2 rounded-full bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-800">{unavailable === "limited" ? "Limited" : unavailable === "out" ? "Out" : "Excused"}</span>}
                {alsoAt.length > 0 && <span className="ml-2 text-xs text-neutral-600">also {alsoAt.join(", ")}</span>}
              </span>
              <span className="flex gap-1">
                <button className={`${btnPlain} min-w-12 px-0`} aria-label={`Move ${player.last} up`} disabled={pending || rank === 1} onClick={() => run(() => movePlayer(p.id, player.id, -1))}>↑</button>
                <button className={`${btnPlain} min-w-12 px-0`} aria-label={`Move ${player.last} down`} disabled={pending || rank === row.players.length} onClick={() => run(() => movePlayer(p.id, player.id, 1))}>↓</button>
                <button className={`${btnDanger} px-3`} aria-label={`Remove ${player.last}`} disabled={pending} onClick={() => run(() => removePlayerFromPosition(p.id, player.id))}>✕</button>
              </span>
            </li>
          ))}
        </ol>
      )}
      <div className="flex gap-2">
        <select className={`${inputCls} mt-0 flex-1`} value={pick} onChange={(e) => setPick(e.target.value)} aria-label={`Add a player to ${p.name}`}>
          <option value="">Add a player…</option>
          {options.map((o) => <option key={o.id} value={o.id}>#{o.number} {o.first} {o.last}{ideas[o.id]?.length ? " ★" : ""}</option>)}
        </select>
        <button className={btnOutline} disabled={pending || !pick} onClick={() => run(() => addPlayerToPosition(p.id, pick), () => setPick(""))}>Add</button>
      </div>
      {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
    </section>
  );
}

export function DepthChartView({ positions, slots, players, ideas, date }: { positions: DepthPosition[]; slots: DepthSlot[]; players: Player[]; ideas: Record<string, string[]>; date: string }) {
  const [unit, setUnit] = useState<Unit>("offense");
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState("");
  const [starters, setStarters] = useState("1");
  const [error, setError] = useState("");
  const [pending, start] = useTransition();
  const { rows, unplaced } = analyze(positions, slots, players, date);
  const shown = rows.filter((r) => r.position.unit === unit);
  const flagged = rows.filter((r) => r.depth !== "ok").length;
  const hinted = unplaced.filter((p) => ideas[p.id]?.length);

  return (
    <div className="space-y-4">
      <PageHeader title="Depth Chart" subtitle={`${flagged} of ${rows.length} positions need attention · ${unplaced.length} players not placed yet`}>
        <button className={btnOutline} onClick={() => setEditing(!editing)}>{editing ? "Done Editing" : "Edit Positions"}</button>
      </PageHeader>

      <div role="tablist" className="flex gap-2 overflow-x-auto">
        {UNITS.map((u) => (
          <button key={u.value} role="tab" aria-selected={unit === u.value} onClick={() => setUnit(u.value)} className={`min-h-12 whitespace-nowrap rounded-lg px-4 font-semibold ${unit === u.value ? "bg-green-900 text-white" : "border border-neutral-300 bg-white"}`}>{u.label}</button>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {shown.map((r) => <PositionCard key={`${r.position.id}-${r.position.name}-${r.position.starters}`} row={r} players={players} ideas={ideas} editing={editing} />)}
      </div>
      {shown.length === 0 && <p className="rounded-xl bg-white p-4 text-neutral-600 shadow-sm">No positions here yet.</p>}

      {editing && (
        <section className="space-y-2 rounded-xl bg-white p-4 shadow-sm">
          <h2>Add a Position to {UNITS.find((u) => u.value === unit)!.label}</h2>
          <div className="grid gap-2 sm:grid-cols-[1fr_auto_auto]">
            <input className={`${inputCls} mt-0`} value={name} maxLength={30} onChange={(e) => setName(e.target.value)} placeholder="Nose Guard, Slot, Kick Returner" aria-label="New position name" />
            <input className={`${inputCls} mt-0 sm:w-24`} type="number" min={1} max={11} value={starters} onChange={(e) => setStarters(e.target.value)} aria-label="Starters" />
            <button className={btnPrimary} disabled={pending || !name.trim()} onClick={() => start(async () => { const r = await addPosition({ unit, name, starters }); if (r.error) setError(r.error); else { setError(""); setName(""); setStarters("1"); } })}>Add</button>
          </div>
          {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
          <p className="text-xs text-neutral-600">Not sure how Jordan splits things up? Rename, add or delete positions here. Nothing else depends on the names.</p>
        </section>
      )}

      <section className="space-y-2 rounded-xl bg-white p-4 shadow-sm">
        <h2>Not Placed Yet · {unplaced.length}</h2>
        {unplaced.length === 0 ? <p className="text-sm text-neutral-600">Everyone is on the chart somewhere.</p> : (
          <>
            {hinted.length > 0 && <p className="text-sm">★ has a Position Ideas note: {hinted.map((p) => `#${p.number} ${p.last} (${ideas[p.id].join("; ").slice(0, 80)})`).join(" · ")}</p>}
            <p className="text-sm text-neutral-700">{unplaced.sort((a, b) => a.number - b.number).map((p) => `#${p.number} ${p.last}`).join(", ")}</p>
          </>
        )}
      </section>
    </div>
  );
}
