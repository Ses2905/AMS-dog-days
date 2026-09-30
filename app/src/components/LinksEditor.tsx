"use client";

import { useState, useTransition } from "react";
import type { GameLink } from "@/lib/db-types";
import { btnDanger, btnPlain, inputCls } from "./ui";

/** A list of named web links that can be opened, added to and removed. Used for film, documents and schedule pages. */
export function LinksEditor({ initial, save, title, hint, empty }: { initial: GameLink[]; save: (links: GameLink[]) => Promise<{ error: string }>; title: string; hint: string; empty: string }) {
  const [links, setLinks] = useState(initial);
  const [label, setLabel] = useState("");
  const [url, setUrl] = useState("");
  const [error, setError] = useState("");
  const [pending, start] = useTransition();

  const commit = (next: GameLink[], after?: () => void) =>
    start(async () => {
      const r = await save(next);
      if (r.error) setError(r.error); else { setError(""); setLinks(next); after?.(); }
    });

  return (
    <section className="space-y-3 rounded-xl bg-white p-4 shadow-sm">
      <div className="flex items-center gap-3"><h2>{title}</h2><span className="ml-auto text-sm text-neutral-600">{hint}</span></div>
      {links.length === 0 ? (
        <p className="text-sm text-neutral-600">{empty}</p>
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
