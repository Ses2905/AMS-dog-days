import Link from "next/link";
import { fmtMinutes } from "@/lib/calendar";
import { prettyDate } from "@/lib/time";
import { practiceWindow, mondayOf, shiftWeek, slotStatus, suggestSource, weekSlots } from "@/lib/week";
import type { Practice } from "@/lib/types";
import { Icon } from "./Icon";
import { PageHeader } from "./PageHeader";
import { Pill } from "./Pill";
import { Row, Section } from "./Row";
import { btnIcon, btnOutline, btnPlain, btnPrimary } from "./ui";

/** The practice workflow: for each session this week, is there a plan, and what is it. Games live on the Calendar and Games tabs. */
export function WeekView({ practices, monday, now }: { practices: Practice[]; monday: string; now: { today: string; minutes: number } }) {
  const days = weekSlots(monday, practices);
  const slots = days.flatMap((d) => d.slots.map((s) => ({ ...s, date: d.date, status: slotStatus(s.practice, d.date, now.today, now.minutes) })));
  const planned = slots.filter((s) => s.practice).length;
  const needPlan = slots.filter((s) => s.status === "needs-plan").length;
  const thisMonday = mondayOf(now.today);

  return (
    <div className="space-y-6">
      <PageHeader title={`Week of ${prettyDate(monday).replace(/^\w+, /, "")}`} subtitle={slots.length === 0 ? "No practices this week" : needPlan > 0 ? `${planned} of ${slots.length} planned · ${needPlan} still need a plan` : `${planned} of ${slots.length} planned`}>
        <Link href={`/calendar?date=${monday}`} className={btnOutline}><Icon name="calendar" />Calendar</Link>
        <Link href="/scripts" className={btnOutline}>Scripts</Link>
        <Link href="/practice/all" className={btnOutline}>All Practices</Link>
        <Link href="/practice/new" className={btnPrimary}><Icon name="plus" />Plan a Practice</Link>
      </PageHeader>

      <div className="flex items-center gap-2">
        <Link href={`/practice?week=${shiftWeek(monday, -1)}`} className={btnIcon} aria-label="Previous week"><Icon name="chevron-left" /></Link>
        {monday !== thisMonday && <Link href="/practice" className={btnPlain}>This Week</Link>}
        <Link href={`/practice?week=${shiftWeek(monday, 1)}`} className={btnIcon} aria-label="Next week"><Icon name="chevron-right" /></Link>
      </div>

      {days.length === 0 && <p className="rounded-2xl bg-white p-5 text-base text-neutral-700 shadow-sm">No practices this week.</p>}

      {days.map((d) => (
        <Section key={d.date} title={<span className="inline-flex items-center gap-3">{prettyDate(d.date)}{d.date === now.today && <Pill tone="gold">Today</Pill>}</span>}>
          {d.slots.map((s) => {
            const status = slotStatus(s.practice, d.date, now.today, now.minutes);
            if (s.practice) {
              return (
                <Row
                  key={s.session} href={`/practice/${s.practice.id}`} lead={fmtMinutes(practiceWindow(s.practice).start)} title={s.session} muted={status === "done"}
                  meta={[s.practice.dress, s.practice.opponent && `${s.practice.opponent} week`].filter(Boolean).join(" · ") || "No details yet"}
                  status={s.practice.imported ? <Pill tone="quiet">Needs Review</Pill> : status === "in-progress" ? <Pill tone="gold">In Progress</Pill> : undefined}
                />
              );
            }
            const source = suggestSource(practices, d.date, s.session);
            const plan = `/practice/new?date=${d.date}&session=${encodeURIComponent(s.session)}${source ? `&from=${source.id}` : ""}`;
            return (
              <Row
                key={s.session} href={plan} lead={s.session === "School Day" ? "Midday" : "Evening"} title={s.session} muted={status === "no-plan"}
                meta={status === "no-plan" ? "No plan on file" : source ? `Starts as a copy of ${prettyDate(source.date)} · ${source.session}` : "Nothing to copy from yet"}
                status={status === "needs-plan" ? <Pill tone="red">Needs a Plan</Pill> : undefined}
              />
            );
          })}
        </Section>
      ))}
    </div>
  );
}
