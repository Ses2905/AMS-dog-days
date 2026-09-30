"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { deleteOutput, runCoachWorkflow, saveGeneratedScript, saveOutput } from "@/app/assistant/actions";
import type { SavedOutput } from "@/lib/db";
import { WORKFLOWS, type Workflow } from "@/lib/ai/workflows";
import type { WorkflowResult } from "@/lib/ai/run";
import { prettyDate } from "@/lib/time";
import { Prose } from "./Prose";
import { btnDanger, btnOutline, btnPlain, btnPrimary, inputCls } from "./ui";

type Choice = { id: string; label: string };

/** The coaching playbooks: pick one, point it at a game or player, and review what comes back. */
export function WorkflowsPanel({ games, players, saved }: { games: Choice[]; players: Choice[]; saved: SavedOutput[] }) {
  const [w, setW] = useState<Workflow | null>(null);
  const [subject, setSubject] = useState("");
  const [input, setInput] = useState("");
  const [res, setRes] = useState<WorkflowResult | null>(null);
  const [err, setErr] = useState("");
  const [note, setNote] = useState("");
  const [open, setOpen] = useState<string | null>(null);
  const [pending, start] = useTransition();

  const pick = (x: Workflow) => { setW(x); setSubject(""); setInput(""); setRes(null); setErr(""); setNote(""); setScriptId(null); };
  const run = () => w && start(async () => {
    setErr(""); setRes(null); setNote(""); setScriptId(null);
    const r = await runCoachWorkflow(w.id, subject, input);
    if (r.ok) setRes(r.value); else setErr(r.error);
  });
  const keep = () => w && res && start(async () => {
    const r = await saveOutput({ workflow: w.id, title: res.title, body: res.body, gameId: w.subject === "game" ? subject : undefined, playerId: w.subject === "player" ? subject : undefined });
    if (r.error) setErr(r.error); else { setErr(""); setNote("Saved below."); }
  });
  const toScript = () => res?.kind === "script" && start(async () => {
    const r = await saveGeneratedScript({ name: res.script.name, rows: res.script.rows, gameId: w?.subject === "game" ? subject : undefined });
    if (r.error) setErr(r.error); else { setErr(""); setNote(`Added to Scripts. `); setScriptId(r.id ?? null); }
  });
  const [scriptId, setScriptId] = useState<string | null>(null);
  const copy = async () => { try { await navigator.clipboard.writeText(res?.body ?? ""); setNote("Copied."); } catch { setNote("Couldn't copy. Select the text instead."); } };
  const options = w?.subject === "game" ? games : w?.subject === "player" ? players : [];

  return (
    <div className="space-y-4">
      <p className="text-sm text-neutral-600">Pick a playbook. It uses what is already in Coach OS, adds what you tell it, and hands back something to review. Nothing changes until you save it.</p>
      <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {WORKFLOWS.map((x) => (
          <li key={x.id}>
            <button onClick={() => pick(x)} aria-pressed={w?.id === x.id} className={`flex min-h-20 w-full flex-col justify-center rounded-xl border p-3 text-left ${w?.id === x.id ? "border-green-900 bg-green-900 text-white" : "border-neutral-200 bg-white hover:shadow"}`}>
              <span className="font-display text-xl font-semibold uppercase tracking-wide">{x.title}</span>
              <span className={`text-sm ${w?.id === x.id ? "text-white/80" : "text-neutral-600"}`}>{x.blurb}</span>
            </button>
          </li>
        ))}
      </ul>

      {w && (
        <section className="space-y-3 rounded-xl bg-white p-4 shadow-sm">
          <h2>{w.title}</h2>
          {w.subject !== "none" && (
            <label className="block text-sm font-semibold">{w.subjectHint}
              <select className={inputCls} value={subject} onChange={(e) => setSubject(e.target.value)}>
                <option value="">{w.subjectHint.includes("optional") ? "No specific game" : "Choose one"}</option>
                {options.map((o) => <option key={o.id} value={o.id}>{o.label}</option>)}
              </select>
            </label>
          )}
          <label className="block text-sm font-semibold">{w.inputLabel}
            <textarea className={`${inputCls} min-h-32 py-2`} maxLength={40000} value={input} onChange={(e) => setInput(e.target.value)} placeholder={w.placeholder} />
          </label>
          {w.scope === "schedule" && <p className="text-xs text-neutral-600">Only the schedule is shared with the assistant for this one. No player names or notes.</p>}
          <button className={btnPrimary} disabled={pending} onClick={run}>{pending && !res ? "Working…" : "Run It"}</button>
          {err && <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-800">{err}</p>}
          {res && (
            <div className="space-y-3 rounded-lg border border-neutral-200 p-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">Draft. Check it before you use it.</p>
              <Prose text={res.body} />
              <div className="flex flex-wrap items-center gap-2">
                <button className={btnOutline} onClick={copy}>Copy</button>
                <button className={btnOutline} disabled={pending} onClick={keep}>Save Result</button>
                {res.kind === "script" && <button className={btnPrimary} disabled={pending || !!scriptId} onClick={toScript}>Add to Scripts</button>}
                <button className={btnPlain} disabled={pending} onClick={run}>Try Again</button>
                {note && <span className="text-sm font-semibold text-green-900">{note}{scriptId && <Link className="underline" href={`/scripts/${scriptId}`}>Open it</Link>}</span>}
              </div>
            </div>
          )}
        </section>
      )}

      {saved.length > 0 && (
        <section className="space-y-2">
          <h2>Saved Results</h2>
          <ul className="overflow-hidden rounded-xl bg-white shadow-sm">
            {saved.map((s) => (
              <li key={s.id} className="border-b border-neutral-200 last:border-0">
                <button className="flex min-h-14 w-full items-center gap-3 px-4 py-2 text-left" aria-expanded={open === s.id} onClick={() => setOpen(open === s.id ? null : s.id)}>
                  <span className="min-w-0 flex-1"><span className="block truncate font-medium">{s.title}</span><span className="block text-xs text-neutral-600">{prettyDate(s.created.slice(0, 10))}</span></span>
                </button>
                {open === s.id && (
                  <div className="space-y-2 bg-wash px-4 py-3">
                    <Prose text={s.body} />
                    <button className={btnDanger} disabled={pending} onClick={() => { if (window.confirm("Delete this saved result?")) start(async () => { const r = await deleteOutput(s.id); if (r.error) setErr(r.error); }); }}>Delete</button>
                  </div>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
