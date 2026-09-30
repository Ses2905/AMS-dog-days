"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { saveSharedLink } from "@/app/share/actions";
import { btnOutline, btnPrimary, inputCls } from "./ui";

export function SharedLink({ initialUrl, initialLabel, games, defaultGameId }: { initialUrl: string; initialLabel: string; games: { id: string; label: string }[]; defaultGameId: string }) {
  const [url, setUrl] = useState(initialUrl);
  const [label, setLabel] = useState(initialLabel);
  const [gameId, setGameId] = useState(defaultGameId);
  const [saved, setSaved] = useState<{ gameId?: string } | null>(null);
  const [error, setError] = useState("");
  const [pending, start] = useTransition();

  if (saved)
    return (
      <div className="space-y-3 rounded-xl bg-white p-4 shadow-sm">
        <h2>Saved</h2>
        <div className="flex flex-wrap gap-2">
          {saved.gameId ? <Link href={`/games/${saved.gameId}`} className={btnPrimary}>Open the game</Link> : <Link href="/notes" className={btnPrimary}>Open notes</Link>}
          <Link href="/" className={btnOutline}>Back to Today</Link>
        </div>
      </div>
    );

  return (
    <div className="space-y-3 rounded-xl bg-white p-4 shadow-sm">
      <label className="block text-sm font-medium">Link<input className={inputCls} value={url} onChange={(e) => setUrl(e.target.value)} inputMode="url" autoCapitalize="none" /></label>
      <label className="block text-sm font-medium">Name (optional)<input className={inputCls} value={label} onChange={(e) => setLabel(e.target.value)} placeholder="Red Zone playlist" /></label>
      <label className="block text-sm font-medium">Put it on
        <select className={inputCls} value={gameId} onChange={(e) => setGameId(e.target.value)}>
          <option value="">No game (save as a note)</option>
          {games.map((g) => <option key={g.id} value={g.id}>{g.label}</option>)}
        </select>
      </label>
      <div className="flex flex-wrap items-center gap-2">
        <p role="alert" className="min-w-0 flex-1 text-sm text-red-700">{error}</p>
        <Link href="/" className="inline-flex min-h-12 items-center rounded-lg border border-neutral-300 bg-white px-4 text-sm font-semibold">Cancel</Link>
        <button className={`${btnPrimary} px-6`} disabled={pending || !url.trim()} onClick={() => start(async () => { const r = await saveSharedLink({ url, label, gameId }); if (r.error) setError(r.error); else { setError(""); setSaved({ gameId: r.gameId }); } })}>{pending ? "Saving…" : "Save"}</button>
      </div>
    </div>
  );
}
