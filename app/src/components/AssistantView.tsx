"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { askAssistant, draftPractice, readTranscript, saveDraftPractice } from "@/app/assistant/actions";
import { createNote } from "@/app/notes/actions";
import type { Source } from "@/lib/ai/context";
import type { DraftResult, Proposal } from "@/lib/ai/schemas";
import type { SavedOutput } from "@/lib/db";
import { PageHeader } from "./PageHeader";
import { WorkflowsPanel } from "./WorkflowsPanel";
import { PracticeGrid } from "./PracticeGrid";
import { btnOutline, btnPlain, btnPrimary, inputCls, tab as tabCls } from "./ui";
import { Icon } from "./Icon";

const TABS = [{ id: "ask", label: "Ask" }, { id: "playbooks", label: "Playbooks" }, { id: "draft", label: "Draft a Practice" }, { id: "transcript", label: "Read a Transcript" }] as const;
type Tab = (typeof TABS)[number]["id"];

const Err = ({ msg }: { msg: string }) => (msg ? <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-800">{msg}</p> : null);
const Note = ({ children }: { children: React.ReactNode }) => <p className="text-sm text-neutral-600">{children}</p>;

function Ask() {
  const [q, setQ] = useState("");
  const [res, setRes] = useState<{ answer: string; sources: Source[] } | null>(null);
  const [err, setErr] = useState("");
  const [pending, start] = useTransition();
  const go = () => start(async () => {
    setErr(""); setRes(null);
    const r = await askAssistant(q);
    if (r.ok) setRes(r.value); else setErr(r.error);
  });
  return (
    <div className="space-y-3">
      <label className="block text-sm font-semibold">Ask about your practices, games, notes and roster
        <textarea className={`${inputCls} min-h-24`} maxLength={1000} value={q} onChange={(e) => setQ(e.target.value)} placeholder="e.g. What's still open for the Farmington game? Who's out this week?" />
      </label>
      <button className={btnPrimary} disabled={pending || !q.trim()} onClick={go}>{pending ? "Thinking…" : "Ask"}</button>
      <Err msg={err} />
      {res && (
        <div className="space-y-2 rounded-xl border border-neutral-200 bg-white p-4">
          <p className="whitespace-pre-wrap">{res.answer}</p>
          {res.sources.length > 0 && (
            <p className="text-sm text-neutral-600">Sources: {res.sources.map((s, i) => <span key={s.href + s.label}>{i > 0 && " · "}<Link className="font-semibold text-green-900 underline" href={s.href}>{s.label}</Link></span>)}</p>
          )}
        </div>
      )}
    </div>
  );
}

function Draft({ today, defaultStart }: { today: string; defaultStart: Record<string, string> }) {
  const [date, setDate] = useState(today);
  const [session, setSession] = useState("Evening");
  const [start, setStart] = useState(defaultStart.Evening);
  const [minutes, setMinutes] = useState(90);
  const [goals, setGoals] = useState("");
  const [res, setRes] = useState<DraftResult | null>(null);
  const [err, setErr] = useState("");
  const [saved, setSaved] = useState<string | null>(null);
  const [pending, start_] = useTransition();
  const [saving, startSave] = useTransition();
  const go = () => start_(async () => {
    setErr(""); setRes(null); setSaved(null);
    const r = await draftPractice({ date, session, start, minutes, goals });
    if (r.ok) setRes(r.value); else setErr(r.error);
  });
  const save = () => startSave(async () => {
    if (!res) return;
    const r = await saveDraftPractice({ date, session, payload: res.payload });
    if (r.error) setErr(r.error); else { setErr(""); setSaved(r.id ?? ""); }
  });
  return (
    <div className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-4">
        <label className="text-sm font-semibold">Date<input type="date" className={inputCls} value={date} onChange={(e) => setDate(e.target.value)} /></label>
        <label className="text-sm font-semibold">Session
          <select className={inputCls} value={session} onChange={(e) => { setSession(e.target.value); if (defaultStart[e.target.value]) setStart(defaultStart[e.target.value]); }}>
            {Object.keys(defaultStart).map((s) => <option key={s}>{s}</option>)}
          </select>
        </label>
        <label className="text-sm font-semibold">Starts<input className={inputCls} value={start} onChange={(e) => setStart(e.target.value)} inputMode="numeric" /></label>
        <label className="text-sm font-semibold">Minutes<input type="number" step={5} min={15} max={180} className={inputCls} value={minutes} onChange={(e) => setMinutes(Number(e.target.value))} /></label>
      </div>
      <label className="block text-sm font-semibold">What should this practice accomplish?
        <textarea className={`${inputCls} min-h-24`} maxLength={1500} value={goals} onChange={(e) => setGoals(e.target.value)} placeholder="e.g. Install the new screen, clean up red zone, light on contact before Friday." />
      </label>
      <button className={btnPrimary} disabled={pending || !goals.trim()} onClick={go}>{pending ? "Drafting…" : "Draft It"}</button>
      <Err msg={err} />
      {res && (
        <div className="space-y-3 rounded-xl border border-neutral-200 bg-white p-4">
          <p className="text-sm font-semibold uppercase tracking-wide text-neutral-500">Draft only. Nothing is saved until you add it.</p>
          {res.reasoning && <p>{res.reasoning}</p>}
          {res.warnings.map((w) => <p key={w} className="rounded-lg bg-[#f6efc9] px-3 py-2 text-sm text-[#5b4d0b]">{w}</p>)}
          <div className="overflow-x-auto"><PracticeGrid practice={res.practice} /></div>
          {res.payload.notes.length > 0 && <ul className="list-disc pl-5 text-sm">{res.payload.notes.map((n) => <li key={n}>{n}</li>)}</ul>}
          {saved ? (
            <p className="font-semibold text-green-900">Added. <Link className="underline" href={`/practice/${saved}/edit`}>Open it to edit</Link></p>
          ) : (
            <div className="flex flex-wrap gap-2">
              <button className={btnPrimary} disabled={saving} onClick={save}>{saving ? "Adding…" : <><Icon name="plus" />Add to My Practices</>}</button>
              <button className={btnPlain} disabled={pending} onClick={go}><Icon name="retry" />Try Again</button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function Transcript() {
  const [text, setText] = useState("");
  const [res, setRes] = useState<{ summary: string; proposals: Proposal[]; suggestions: string[] } | null>(null);
  const [state, setState] = useState<Record<string, "added" | "skipped">>({});
  const [err, setErr] = useState("");
  const [pending, start] = useTransition();
  const [busy, startAdd] = useTransition();
  const go = () => start(async () => {
    setErr(""); setRes(null); setState({});
    const r = await readTranscript(text);
    if (r.ok) setRes(r.value); else setErr(r.error);
  });
  const add = (p: Proposal) => startAdd(async () => {
    const r = await createNote(p.note);
    if (r.error) setErr(r.error); else { setErr(""); setState((s) => ({ ...s, [p.key]: "added" })); }
  });
  return (
    <div className="space-y-3">
      <label className="block text-sm font-semibold">Paste the transcript or your rambling notes
        <textarea className={`${inputCls} min-h-40`} maxLength={40000} value={text} onChange={(e) => setText(e.target.value)} placeholder="Post-game recording, film session, drive-home thoughts…" />
      </label>
      <button className={btnPrimary} disabled={pending || !text.trim()} onClick={go}>{pending ? "Reading…" : "Find Notes & Action Items"}</button>
      <Err msg={err} />
      {res && (
        <div className="space-y-3 rounded-xl border border-neutral-200 bg-white p-4">
          {res.summary && <p>{res.summary}</p>}
          {res.proposals.length === 0 && <Note>Nothing worth saving turned up.</Note>}
          <ul className="space-y-2">
            {res.proposals.map((p) => (
              <li key={p.key} className={`rounded-lg border p-3 ${state[p.key] === "skipped" ? "opacity-50" : ""}`}>
                <p className="text-xs font-bold uppercase tracking-wide text-neutral-500">{p.note.kind === "action" ? "Action item" : "Note"}{p.label && ` · ${p.label}`}{p.note.due && ` · due ${p.note.due}`}</p>
                <p>{p.note.body}</p>
                <div className="mt-2 flex gap-2">
                  {state[p.key] === "added" ? <span className="font-semibold text-green-900">Added</span> : state[p.key] === "skipped" ? <button className={btnPlain} onClick={() => setState((s) => { const n = { ...s }; delete n[p.key]; return n; })}>Undo Skip</button> : (
                    <>
                      <button className={btnOutline} disabled={busy} onClick={() => add(p)}>Add</button>
                      <button className={btnPlain} onClick={() => setState((s) => ({ ...s, [p.key]: "skipped" }))}>Skip</button>
                    </>
                  )}
                </div>
              </li>
            ))}
          </ul>
          {res.suggestions.length > 0 && (
            <div>
              <h2 className="text-lg">Worth a Look (you make these changes)</h2>
              <ul className="list-disc pl-5 text-sm">{res.suggestions.map((s) => <li key={s}>{s}</li>)}</ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function Off() {
  return (
    <div className="space-y-2 rounded-xl border border-neutral-200 bg-white p-4">
      <h2 className="text-xl">Not Switched On Yet</h2>
      <p className="text-sm">The screens are ready. To turn the assistant on:</p>
      <ol className="list-decimal space-y-1 pl-5 text-sm">
        <li>In Vercel, open AI Gateway and create an API key.</li>
        <li>In the <strong>coach-os-app</strong> project, add it as <code>AI_GATEWAY_API_KEY</code> for Production and Preview.</li>
        <li>Redeploy. This page will then let you ask, draft and read transcripts.</li>
      </ol>
      <Note>Players are only ever shared with the assistant as jersey number and last name. It suggests; you approve.</Note>
    </div>
  );
}

export function AssistantView({ ready, today, defaultStart, games, players, saved }: { ready: boolean; today: string; defaultStart: Record<string, string>; games: { id: string; label: string }[]; players: { id: string; label: string }[]; saved: SavedOutput[] }) {
  const [tab, setTab] = useState<Tab>("ask");
  return (
    <div className="mx-auto max-w-4xl space-y-4 px-4 py-6">
      <PageHeader title="Assistant" subtitle="Suggests. You decide." />
      {!ready ? <Off /> : (
        <>
          <div role="tablist" className="flex gap-2 overflow-x-auto">
            {TABS.map((t) => (
              <button key={t.id} role="tab" aria-selected={tab === t.id} onClick={() => setTab(t.id)} className={tabCls(tab === t.id)}>{t.label}</button>
            ))}
          </div>
          {tab === "ask" && <Ask />}
          {tab === "playbooks" && <WorkflowsPanel games={games} players={players} saved={saved} />}
          {tab === "draft" && <Draft today={today} defaultStart={defaultStart} />}
          {tab === "transcript" && <Transcript />}
        </>
      )}
    </div>
  );
}
