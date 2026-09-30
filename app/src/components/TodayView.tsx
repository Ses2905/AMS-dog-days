import Link from "next/link";
import { calendarItems } from "@/lib/calendar";
import type { Game, Note } from "@/lib/db-types";
import type { AttendanceRow } from "@/lib/attendance";
import { isOverdue, openActions } from "@/lib/notes";
import { prettyDate } from "@/lib/time";
import type { Player, Practice } from "@/lib/types";
import { attention, nextUp } from "@/lib/today";
import { mondayOf, shiftWeek, slotStatus, weekSlots } from "@/lib/week";
import { Icon } from "./Icon";
import { PageHeader } from "./PageHeader";
import { Pill } from "./Pill";
import { Row, Section } from "./Row";
import { btnOutline, btnPrimary } from "./ui";

const shortDay = (iso: string) => new Date(`${iso}T00:00:00Z`).toLocaleDateString("en-US", { weekday: "short", timeZone: "UTC" });

/** Today, in priority order: what is next, what needs him, what is coming, what is open. */
export function TodayView({ now, practices, games, notes, players, attendance }: { now: { today: string; minutes: number }; practices: Practice[]; games: Game[]; notes: Note[]; players: Player[]; attendance: AttendanceRow[] }) {
  const next = nextUp(now, practices, games);
  const attendedIds = new Set(attendance.map((a) => a.practiceId));
  const soon = new Date(`${now.today}T00:00:00Z`); soon.setUTCDate(soon.getUTCDate() + 3);
  const soonIso = soon.toISOString().slice(0, 10);
  const missingPlans = [mondayOf(now.today), shiftWeek(mondayOf(now.today), 1)]
    .flatMap((m) => weekSlots(m, practices))
    .flatMap((d) => d.slots.filter((s) => slotStatus(s.practice, d.date, now.today, now.minutes) === "needs-plan" && d.date <= soonIso).map((s) => ({ date: d.date, session: s.session })));
  const needs = attention(now, { practices, games, notes, players, attendedIds, missingPlans });
  const coming = calendarItems("week", now.today, practices, games, now).concat(calendarItems("week", shiftWeek(mondayOf(now.today), 1), practices, games, now))
    .filter((i) => !i.empty && i.date >= now.today && !(next && i.key.endsWith(next.id)) && !(i.date === now.today && i.status === "done"))
    .slice(0, 5);
  const actions = openActions(notes, now.today);
  const rest = actions.filter((n) => !isOverdue(n, now.today));
  const hello = now.minutes < 12 * 60 ? "Good Morning" : now.minutes < 17 * 60 ? "Good Afternoon" : "Good Evening";
  const todaysPractice = next?.kind === "practice" && next.date === now.today;

  return (
    <div className="space-y-6">
      <PageHeader title="Today" subtitle={`${hello}, Coach. ${prettyDate(now.today)}`}>
        <Link href="/week-ahead" className={btnOutline}><Icon name="calendar" />Week Ahead</Link>
        <Link href="/notes?add=1&kind=action" className={btnOutline}><Icon name="plus" />Add Action Item</Link>
        <Link href="/notes?add=1&kind=note" className={btnPrimary}><Icon name="plus" />Add Note</Link>
      </PageHeader>

      {next ? (
        <section className="rounded-2xl bg-green-900 p-6 text-white shadow-sm sm:p-8">
          <p className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-gold-500"><Icon name={next.kind === "practice" ? "practice" : "trophy"} size={16} />Next Up · {next.when}</p>
          <h2 className="mt-2 text-4xl leading-none sm:text-5xl">{next.title}</h2>
          <p className="mt-2 text-lg text-white/85">{prettyDate(next.date)} · {next.meta}</p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href={next.href} className="inline-flex min-h-12 items-center gap-2 rounded-lg bg-gold-500 px-5 text-base font-semibold text-green-900 transition-colors hover:brightness-95">{next.kind === "practice" ? "Open Plan" : "Open Game"}<Icon name="chevron-right" /></Link>
            {todaysPractice && <Link href={`${next.href}#attendance`} className="inline-flex min-h-12 items-center gap-2 rounded-lg border border-white/40 px-5 text-base font-semibold text-white transition-colors hover:bg-white/10"><Icon name="check" />Take Attendance</Link>}
          </div>
        </section>
      ) : (
        <section className="rounded-2xl bg-white p-6 shadow-sm">
          <h2 className="text-2xl">Nothing Scheduled</h2>
          <p className="mt-1 text-neutral-600">Plan a practice or add a game to get started.</p>
          <div className="mt-4 flex gap-3"><Link href="/practice/new" className={btnPrimary}><Icon name="plus" />Plan a Practice</Link></div>
        </section>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <Section title="Needs Your Attention">
          {needs.length === 0 ? (
            <p className="flex items-center gap-3 px-5 py-4 text-base text-neutral-700"><Icon name="check" className="text-green-600" />You&apos;re all caught up.</p>
          ) : needs.map((a) => (
            <Row key={a.key} href={a.href} title={a.title} meta={a.meta} status={a.urgent ? <Pill tone="red">{a.badge ?? "Now"}</Pill> : undefined} />
          ))}
        </Section>

        <Section title="Coming Up" action={<Link href="/calendar" className="inline-flex min-h-10 items-center gap-1 text-sm font-semibold text-green-600 underline">Full Calendar</Link>}>
          {coming.length === 0 ? <p className="px-5 py-4 text-base text-neutral-700">Nothing else scheduled this week or next.</p> : coming.map((i) => (
            <Row key={i.key} href={i.href} lead={<><span className="block text-xs font-semibold uppercase tracking-wide text-neutral-500">{i.date === now.today ? "Today" : shortDay(i.date)}</span>{i.time.replace(" ", "")}</>} title={i.title} meta={i.kind === "game" ? [i.badge, i.place].filter(Boolean).join(" · ") : i.detail} tone={i.kind === "game" ? "game" : "normal"} />
          ))}
        </Section>
      </div>

      {rest.length > 0 && (
        <Section title="Open Action Items" count={rest.length} action={rest.length > 4 ? <Link href="/notes?show=open" className="inline-flex min-h-10 items-center text-sm font-semibold text-green-600 underline">See All</Link> : undefined}>
          {rest.slice(0, 4).map((n) => (
            <Row key={n.id} href="/notes?show=open" title={n.body.length > 100 ? `${n.body.slice(0, 100)}…` : n.body} meta={n.due ? `Due ${prettyDate(n.due)}` : undefined} />
          ))}
        </Section>
      )}
    </div>
  );
}
