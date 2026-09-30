import Link from "next/link";
import { calendarItems, shiftAnchor, viewDays, type CalItem, type CalKind, type CalView } from "@/lib/calendar";
import type { Game } from "@/lib/db-types";
import { LEVELS } from "@/lib/games";
import { prettyDate } from "@/lib/time";
import type { Practice } from "@/lib/types";
import type { SlotStatus } from "@/lib/week";
import { PageHeader } from "./PageHeader";
import { btnPlain } from "./ui";

const STATUS_LABEL: Record<SlotStatus, string> = { done: "Done", "in-progress": "In progress", "later-today": "Later today", planned: "Planned", "needs-plan": "Needs a plan", "no-plan": "No plan on file" };
const STATUS_STYLE: Record<SlotStatus, string> = { done: "bg-green-600/10 text-green-900", "in-progress": "bg-gold-500 text-green-900", "later-today": "bg-neutral-200 text-neutral-800", planned: "bg-neutral-200 text-neutral-800", "needs-plan": "bg-red-100 text-red-800", "no-plan": "bg-neutral-100 text-neutral-500" };

type Params = { view: CalView; show: CalKind; level: string; anchor: string };
const href = (p: Params, patch: Partial<Params>) => {
  const n = { ...p, ...patch };
  const qs = new URLSearchParams();
  if (n.view !== "week") qs.set("view", n.view);
  if (n.show !== "all") qs.set("show", n.show);
  if (n.level !== "all") qs.set("team", n.level);
  qs.set("date", n.anchor);
  return `/calendar?${qs.toString()}`;
};

function Chip({ on, to, children }: { on: boolean; to: string; children: React.ReactNode }) {
  return <Link href={to} aria-current={on ? "true" : undefined} className={`inline-flex min-h-10 items-center rounded-full px-4 text-sm font-semibold ${on ? "bg-green-900 text-white" : "border border-neutral-300 bg-white"}`}>{children}</Link>;
}

function Row({ item }: { item: CalItem }) {
  const game = item.kind === "game";
  return (
    <li>
      <Link href={item.href} className={`flex min-h-14 items-center gap-3 px-4 py-2 hover:bg-wash ${game ? "bg-[#f1ecd3]" : ""}`}>
        <span className="min-w-0 flex-1">
          <span className="flex flex-wrap items-center gap-2">
            {game ? <span className="rounded-full bg-gold-500 px-2 py-0.5 text-xs font-bold uppercase tracking-wide text-green-900">{item.badge}</span> : null}
            <span className={game ? "font-display text-xl font-semibold uppercase tracking-wide" : "font-medium"}>{item.title}</span>
            {item.status && <span className={`rounded-full px-3 py-0.5 text-xs font-semibold ${STATUS_STYLE[item.status]}`}>{STATUS_LABEL[item.status]}</span>}
          </span>
          <span className="block text-sm text-neutral-600">{item.detail}</span>
        </span>
        <span className="text-sm font-semibold text-green-900">{item.empty ? "Plan it" : "Open"}</span>
      </Link>
    </li>
  );
}

/** One calendar for everything. Items open into the Practice and Games workflows. */
export function CalendarView({ view, show, level, anchor, practices, games, now }: { view: CalView; show: CalKind; level: string; anchor: string; practices: Practice[]; games: Game[]; now: { today: string; minutes: number } }) {
  const p: Params = { view, show, level, anchor };
  const { days, label } = viewDays(view, anchor);
  const items = calendarItems(view, anchor, practices, games, now, show, level as "all");
  const byDay = new Map<string, CalItem[]>();
  for (const it of items) byDay.set(it.date, [...(byDay.get(it.date) ?? []), it]);
  const agenda = days.filter((d) => byDay.has(d) || d === now.today);
  const month = anchor.slice(0, 7);

  return (
    <div className="space-y-4">
      <PageHeader title={label} subtitle={[`${items.filter((i) => i.kind === "practice" && !i.empty).length} practices planned`, items.some((i) => i.empty) ? `${items.filter((i) => i.empty).length} need a plan` : "", `${items.filter((i) => i.kind === "game").length} games`].filter(Boolean).join(" · ")}>
        <Chip on={view === "week"} to={href(p, { view: "week" })}>Week</Chip>
        <Chip on={view === "month"} to={href(p, { view: "month" })}>Month</Chip>
      </PageHeader>

      <div className="flex flex-wrap items-center gap-2">
        <Link href={href(p, { anchor: shiftAnchor(view, anchor, -1) })} className={`${btnPlain} min-w-12`} aria-label={`Previous ${view}`}>←</Link>
        <Link href={href(p, { anchor: now.today })} className={btnPlain}>Today</Link>
        <Link href={href(p, { anchor: shiftAnchor(view, anchor, 1) })} className={`${btnPlain} min-w-12`} aria-label={`Next ${view}`}>→</Link>
        <span className="mx-1 hidden h-6 w-px bg-neutral-300 sm:block" aria-hidden />
        <Chip on={show === "all"} to={href(p, { show: "all" })}>All</Chip>
        <Chip on={show === "practice"} to={href(p, { show: "practice" })}>Practices</Chip>
        <Chip on={show === "game"} to={href(p, { show: "game" })}>Games</Chip>
        {show !== "practice" && (
          <>
            <span className="mx-1 hidden h-6 w-px bg-neutral-300 sm:block" aria-hidden />
            <Chip on={level === "all"} to={href(p, { level: "all" })}>Every team</Chip>
            {LEVELS.map((l) => <Chip key={l.value} on={level === l.value} to={href(p, { level: l.value })}>{l.label}</Chip>)}
          </>
        )}
      </div>

      {view === "month" && (
        <div className="hidden overflow-hidden rounded-xl bg-white shadow-sm md:block">
          <div className="grid grid-cols-7 border-b border-neutral-200 bg-wash text-xs font-semibold uppercase tracking-wide text-neutral-600">
            {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => <div key={d} className="px-2 py-1.5">{d}</div>)}
          </div>
          <div className="grid grid-cols-7">
            {days.map((d) => {
              const list = byDay.get(d) ?? [];
              return (
                <div key={d} className={`min-h-28 border-b border-r border-neutral-100 p-1.5 ${d.slice(0, 7) !== month ? "bg-neutral-50 text-neutral-400" : ""}`}>
                  <p className={`mb-1 text-xs font-semibold ${d === now.today ? "inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-gold-500 px-1 text-green-900" : ""}`}>{Number(d.slice(8))}</p>
                  <ul className="space-y-1">
                    {list.slice(0, 4).map((it) => (
                      <li key={it.key}><Link href={it.href} className={`block truncate rounded px-1.5 py-0.5 text-xs font-medium ${it.kind === "game" ? "bg-gold-500 text-green-900" : it.empty ? "bg-red-100 text-red-800" : "bg-green-900/10 text-green-900"}`}>{it.kind === "game" ? `${it.badge.replace("7th / ", "")} ${it.title}` : it.title.replace(" practice", "")}</Link></li>
                    ))}
                    {list.length > 4 && <li className="px-1.5 text-xs text-neutral-600">+{list.length - 4} more</li>}
                  </ul>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className={view === "month" ? "space-y-3 md:hidden" : "space-y-3"}>
        {agenda.length === 0 && <p className="rounded-xl bg-white p-4 text-neutral-600 shadow-sm">Nothing scheduled here.</p>}
        {agenda.filter((d) => view === "week" || d.slice(0, 7) === month).map((d) => (
          <section key={d} className="overflow-hidden rounded-xl bg-white shadow-sm">
            <h2 className="flex items-center gap-2 border-b border-neutral-200 px-4 py-2 text-lg">
              {prettyDate(d)}
              {d === now.today && <span className="rounded-full bg-gold-500 px-2 py-0.5 font-sans text-xs font-semibold normal-case tracking-normal text-green-900">Today</span>}
            </h2>
            {(byDay.get(d) ?? []).length === 0 ? <p className="px-4 py-3 text-sm text-neutral-600">Nothing scheduled.</p> : <ul className="divide-y divide-neutral-200">{byDay.get(d)!.map((it) => <Row key={it.key} item={it} />)}</ul>}
          </section>
        ))}
      </div>
    </div>
  );
}
