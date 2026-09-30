"use client";

import { useState, useTransition } from "react";
import type { GameLink } from "@/lib/db-types";
import { Section } from "./Row";
import { btnIconSm, btnPlain, inputCls } from "./ui";
import { Icon } from "./Icon";

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
    <Section title={title} action={<span className="hidden text-sm text-neutral-600 sm:inline">{hint}</span>}>
      {links.length === 0 ? (
        <p className="px-5 py-4 text-base text-neutral-700">{empty}</p>
      ) : links.map((l, i) => (
        <div key={`${l.url}-${i}`} className="flex min-h-14 items-center gap-2 pl-5 pr-3">
          <a href={l.url} target="_blank" rel="noopener noreferrer" className="flex min-h-12 min-w-0 flex-1 items-center gap-2 text-base font-semibold text-green-600 hover:underline">
            <span className="truncate">{l.label}</span><Icon name="external" size={14} className="shrink-0" />
          </a>
          <button className={btnIconSm} disabled={pending} aria-label={`Remove ${l.label}`} onClick={() => commit(links.filter((_, j) => j !== i))}><Icon name="trash" size={18} /></button>
        </div>
      ))}
      <div className="space-y-3 p-5">
        <div className="grid gap-3 sm:grid-cols-[1fr_2fr_auto]">
          <input className={`${inputCls} mt-0`} value={label} onChange={(e) => setLabel(e.target.value)} placeholder="Name (optional)" aria-label="Link name" />
          <input className={`${inputCls} mt-0`} value={url} onChange={(e) => setUrl(e.target.value)} placeholder="Paste a link" aria-label="Link address" inputMode="url" autoCapitalize="none" />
          <button className={btnPlain} disabled={pending || !url.trim()} onClick={() => commit([...links, { label, url }], () => { setLabel(""); setUrl(""); })}><Icon name="plus" />Add Link</button>
        </div>
        {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
      </div>
    </Section>
  );
}
