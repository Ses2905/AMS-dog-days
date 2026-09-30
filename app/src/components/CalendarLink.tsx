"use client";

import { useState, useTransition } from "react";
import { resetCalendarLink } from "@/app/settings/actions";
import { Section } from "./Row";
import { btnDanger, btnOutline } from "./ui";
import { Icon } from "./Icon";

/** The private subscribe link, with copy, reset, and how to add it to the iPhone and Google calendars. */
export function CalendarLink({ url }: { url: string }) {
  const [note, setNote] = useState("");
  const [pending, start] = useTransition();
  const copy = async () => { try { await navigator.clipboard.writeText(url); setNote("Copied."); } catch { setNote("Couldn't copy. Press and hold the link to select it."); } };
  return (
    <Section title="Calendar Link">
      <div className="space-y-4 p-5">
      <p className="text-sm text-neutral-700">Add every practice and game to the calendar app on a phone. It updates by itself. Anyone with this link can see the schedule (no player names), so keep it private.</p>
      <input readOnly value={url} onFocus={(e) => e.currentTarget.select()} aria-label="Private calendar link" className="min-h-12 w-full rounded-lg border border-neutral-300 bg-wash px-3 text-sm" />
      <div className="flex flex-wrap items-center gap-2">
        <button className={btnOutline} onClick={copy}><Icon name="copy" />Copy Link</button>
        <button className={btnDanger} disabled={pending} onClick={() => { if (window.confirm("Make a new link? The old one stops working and phones using it will need the new one.")) start(async () => { const r = await resetCalendarLink(); setNote(r.error || "New link made. Copy it again."); }); }}>Make a New Link</button>
        {note && <span className="text-sm font-semibold text-green-900">{note}</span>}
      </div>
      <details className="text-sm">
        <summary className="min-h-10 cursor-pointer py-2 font-semibold text-green-900">How to add it</summary>
        <div className="space-y-2 pb-2 text-neutral-700">
          <p><b>iPhone:</b> Settings, Calendar, Accounts, Add Account, Other, Add Subscribed Calendar. Paste the link and tap Next.</p>
          <p><b>Google Calendar (on a computer):</b> Other calendars, the plus sign, From URL. Paste the link. It can take a few hours to appear on Google&apos;s side.</p>
          <p>Practice times come from each plan&apos;s first period. A practice with no plan yet does not show up. Reminders are set in your own calendar app.</p>
        </div>
      </details>
      </div>
    </Section>
  );
}
