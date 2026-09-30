import Link from "next/link";
import { prettyDate } from "@/lib/time";
import { PageHeader } from "./PageHeader";
import { btnOutline, btnPlain, btnPrimary } from "./ui";
import { mondayOf, shiftWeek, slotStatus, suggestSource, weekSlots, type SlotStatus } from "@/lib/week";
import type { Practice } from "@/lib/types";

const LABEL: Record<SlotStatus, string> = { done: "Done", "in-progress": "In progress", "later-today": "Later today", planned: "Planned", "needs-plan": "Needs a plan", "no-plan": "No plan on file" };
const STYLE: Record<SlotStatus, string> = {
  done: "bg-green-600/10 text-green-900",
  "in-progress": "bg-gold-500 text-green-900",
  "later-today": "bg-neutral-200 text-neutral-800",
  planned: "bg-neutral-200 text-neutral-800",
  "needs-plan": "bg-red-100 text-red-800",
  "no-plan": "bg-neutral-100 text-neutral-500",
};

export function WeekView({ practices, monday, now }: { practices: Practice[]; monday: string; now: { today: string; minutes: number } }) {
  const days = weekSlots(monday, practices);
  const slots = days.flatMap((d) => d.slots.map((s) => ({ ...s, date: d.date, status: slotStatus(s.practice, d.date, now.today, now.minutes) })));
  const planned = slots.filter((s) => s.practice).length;
  const needPlan = slots.filter((s) => s.status === "needs-plan").length;
  const thisMonday = mondayOf(now.today);

  return (
    <div className="space-y-5">
      <PageHeader subtitle="Plans, scripts and attendance for each session" title={`Week of ${prettyDate(monday).replace(/^\w+, /, "")}`}>
        <Link href={`/calendar?date=${monday}`} className={btnOutline}>Calendar</Link>
        <Link href="/scripts" className={btnOutline}>Scripts</Link>
        <Link href="/practice/all" className={btnOutline}>All practices</Link>
        <Link href="/practice/new" className={btnPrimary}>Plan a practice</Link>
      </PageHeader>
      <div className="flex gap-2">
        <Link href={`/practice?week=${shiftWeek(monday, -1)}`} className={`${btnPlain} min-w-12`} aria-label="Previous week">←</Link>
        {monday !== thisMonday && <Link href="/practice" className={btnPlain}>This week</Link>}
        <Link href={`/practice?week=${shiftWeek(monday, 1)}`} className={`${btnPlain} min-w-12`} aria-label="Next week">→</Link>
      </div>

      <p className="text-sm text-neutral-700">
        <b>{planned} of {slots.length}</b> practices planned
        {needPlan > 0 ? <> · <b className="text-red-800">{needPlan} still need a plan</b></> : slots.length > 0 ? " · nothing missing" : ""}
      </p>

      {days.length === 0 && <p className="rounded-xl bg-white p-4 text-sm shadow-sm">No practices this week.</p>}

      {days.map((d) => (
        <section key={d.date} className="overflow-hidden rounded-xl bg-white shadow-sm">
          <h2 className="flex items-center gap-2 border-b border-neutral-200 px-4 py-2 font-semibold">
            {prettyDate(d.date)}
            {d.date === now.today && <span className="rounded-full bg-gold-500 px-2 py-0.5 text-xs font-semibold text-green-900">Today</span>}
          </h2>
          <ul className="divide-y divide-neutral-200">
            {d.slots.map((s) => {
              const status = slotStatus(s.practice, d.date, now.today, now.minutes);
              const source = s.practice ? undefined : suggestSource(practices, d.date, s.session);
              const plan = `/practice/new?date=${d.date}&session=${encodeURIComponent(s.session)}${source ? `&from=${source.id}` : ""}`;
              return (
                <li key={s.session} className="flex min-h-16 items-center gap-3 px-4 py-2">
                  <div className="min-w-0 flex-1 space-y-1">
                    <p className="flex flex-wrap items-center gap-2">
                      <span className="font-medium">{s.session}</span>
                      <span className={`rounded-full px-3 py-1 text-xs font-semibold ${STYLE[status]}`}>{LABEL[status]}</span>
                      {s.practice?.imported && <span className="rounded bg-[#f8f4e3] px-1.5 py-0.5 text-xs text-neutral-700">review</span>}
                    </p>
                    <p className="text-sm text-neutral-600">
                      {s.practice ? [s.practice.dress, s.practice.opponent && `vs ${s.practice.opponent}`].filter(Boolean).join(" · ") || "No details yet" : source ? `Would copy ${prettyDate(source.date)} · ${source.session}` : "Nothing to copy from yet"}
                    </p>
                  </div>
                  {s.practice ? (
                    <Link href={`/practice/${s.practice.id}`} className="inline-flex min-h-12 items-center rounded-lg border border-green-900 px-4 text-sm font-semibold text-green-900">Open</Link>
                  ) : (
                    <Link href={plan} className={`inline-flex min-h-12 items-center rounded-lg px-4 text-sm font-semibold ${status === "needs-plan" ? "bg-green-900 text-white" : "border border-neutral-300"}`}>{status === "needs-plan" ? "Plan it" : "Add"}</Link>
                  )}
                </li>
              );
            })}
          </ul>
        </section>
      ))}

    </div>
  );
}
