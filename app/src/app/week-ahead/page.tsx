import Link from "next/link";
import { connection } from "next/server";
import { Icon } from "@/components/Icon";
import { PageHeader } from "@/components/PageHeader";
import { Pill } from "@/components/Pill";
import { Row, Section } from "@/components/Row";
import { btnOutline } from "@/components/ui";
import { getGames, getNotes, getPlayers, getPractices } from "@/lib/db";
import { prettyDate } from "@/lib/time";
import { weekAhead } from "@/lib/week-ahead";
import { nowInSchool } from "@/lib/week";

export default async function WeekAheadPage() {
  await connection();
  const now = nowInSchool();
  const [practices, games, notes, players] = await Promise.all([getPractices(), getGames(), getNotes(), getPlayers()]);
  const w = weekAhead(now, { practices, games, notes, players });
  const away = w.away.out + w.away.limited + w.away.excused;

  return (
    <div className="space-y-6">
      <PageHeader title="Week Ahead" subtitle={`${prettyDate(w.monday)} to ${prettyDate(w.sunday)}`}>
        <Link href="/practice" className={btnOutline}><Icon name="practice" />Practice Week</Link>
      </PageHeader>
      <p className="text-lg font-medium text-ink">{w.headline}.</p>

      <Section title="Practices" count={w.practices.length}>
        {w.practices.length === 0 ? <p className="px-5 py-4 text-base text-neutral-700">No practices this week.</p> : w.practices.map((p) => (
          <Row
            key={`${p.date}-${p.session}`} href={p.id ? `/practice/${p.id}` : `/practice/new?date=${p.date}&session=${encodeURIComponent(p.session)}`}
            title={`${p.session} Practice`} meta={prettyDate(p.date)}
            status={p.planned ? undefined : <Pill tone="red">Needs a Plan</Pill>}
          />
        ))}
      </Section>

      {w.games.length > 0 && (
        <Section title="Games" count={w.games.length}>
          {w.games.map((g) => <Row key={g.id} href={`/games/${g.id}`} tone="game" title={g.title} meta={`${prettyDate(g.date)} · ${g.prep}`} status={g.prepDone ? <Pill tone="green">Ready</Pill> : undefined} />)}
        </Section>
      )}

      {(w.overdue.length > 0 || w.dueThisWeek.length > 0) && (
        <Section title="Action Items" count={w.overdue.length + w.dueThisWeek.length}>
          {[...w.overdue, ...w.dueThisWeek].map((n) => (
            <Row key={n.id} href="/notes?show=open" title={n.body.length > 100 ? `${n.body.slice(0, 100)}…` : n.body} meta={n.due ? `Due ${prettyDate(n.due)}` : undefined} status={w.overdue.includes(n) ? <Pill tone="red">Overdue</Pill> : undefined} />
          ))}
        </Section>
      )}

      {away > 0 && (
        <Section title="Players">
          <Row href="/roster" title={`${away} player${away === 1 ? "" : "s"} not fully available`} meta={[w.away.out && `${w.away.out} out`, w.away.limited && `${w.away.limited} limited`, w.away.excused && `${w.away.excused} excused`].filter(Boolean).join(" · ")} />
        </Section>
      )}
    </div>
  );
}
