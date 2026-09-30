import Image from "next/image";
import Link from "next/link";
import { connection } from "next/server";
import { availabilityOn } from "@/lib/availability";
import { getGames, getNotes, getPlayers, getPractices } from "@/lib/db";
import { levelLabel, nextGame, prepProgress, vsLabel } from "@/lib/games";
import { isOverdue, openActions } from "@/lib/notes";
import { mondayOf, nowInSchool, slotStatus, weekSlots } from "@/lib/week";
import { prettyDate } from "@/lib/time";

const todayIso = () => new Date().toLocaleDateString("en-CA", { timeZone: "America/Chicago" });

export default async function Home() {
  await connection();
  const today = todayIso();
  const [practices, players, notes, games] = await Promise.all([getPractices(), getPlayers(), getNotes(), getGames()]);
  const game = nextGame(games, today);
  const prep = game ? prepProgress(game.checklist) : null;
  const actions = openActions(notes, today);
  const sorted = [...practices].sort((a, b) => a.date.localeCompare(b.date) || a.id.localeCompare(b.id));
  const todays = sorted.filter((p) => p.date === today);
  const next = todays[0] ?? sorted.find((p) => p.date > today);
  const clock = nowInSchool();
  const weekNeeds = weekSlots(mondayOf(today), practices).flatMap((d) => d.slots.map((s) => slotStatus(s.practice, d.date, clock.today, clock.minutes))).filter((s) => s === "needs-plan").length;
  const avail = availabilityOn(players, next?.date ?? today);
  const grade9 = players.filter((p) => p.grade === 9).length;
  const grade8 = players.filter((p) => p.grade === 8).length;

  return (
    <div className="space-y-6">
      <section className="flex items-center gap-5 rounded-2xl bg-green-900 p-6 text-white">
        <Image src="/brand/airedale-head-white-on-green.png" alt="" width={96} height={96} className="hidden rounded-xl sm:block" />
        <div className="min-w-0">
          <p className="text-sm text-white/70">{next ? (next.date === today ? "Today" : "Next up") : "No practice scheduled"}</p>
          {next ? (
            <>
              <h1 className="text-3xl">{prettyDate(next.date)} · {next.session}</h1>
              <p className="mt-1 text-white/80">
                {next.blocks[0].start} to {next.blocks.at(-1)!.start} · {next.dress}
                {next.opponent ? ` · vs ${next.opponent} week` : ""}
              </p>
              <Link href={`/practice/${next.id}`} className="mt-4 inline-flex min-h-12 items-center rounded-lg bg-gold-500 px-5 font-semibold text-green-900">
                Open Practice
              </Link>
            </>
          ) : (
            <h1 className="text-3xl">Good afternoon, Coach.</h1>
          )}
        </div>
      </section>

      {todays.length > 1 && (
        <section className="rounded-xl bg-white p-4 shadow-sm">
          <h2 className="mb-2 font-semibold">Also today</h2>
          <ul className="space-y-1">
            {todays.slice(1).map((p) => (
              <li key={p.id}><Link className="text-green-600 underline" href={`/practice/${p.id}`}>{p.session} practice</Link></li>
            ))}
          </ul>
        </section>
      )}

      {next && next.notes.length > 0 && (
        <section className="rounded-xl bg-white p-4 shadow-sm">
          <h2 className="mb-2 font-semibold">Practice Notes</h2>
          <ul className="list-disc space-y-1 pl-5 text-sm">
            {next.notes.map((n) => <li key={n}>{n}</li>)}
          </ul>
        </section>
      )}

      {game && prep && (
        <Link href={`/games/${game.id}`} className="block rounded-xl bg-white p-4 shadow-sm hover:shadow">
          <p className="text-sm text-neutral-600">Next game · {levelLabel(game.level)}{game.date === today ? " · today" : ""}</p>
          <p className="font-display text-2xl font-semibold uppercase tracking-wide">{vsLabel(game)}</p>
          <p className="text-sm text-neutral-700">{prettyDate(game.date)}{game.time ? ` · ${game.time}` : ""}{game.location ? ` · ${game.location}` : ""}</p>
          <p className={`mt-1 text-sm font-semibold ${prep.done === prep.total ? "text-green-900" : "text-neutral-700"}`}>Prep {prep.done} of {prep.total} ready</p>
        </Link>
      )}

      <section className="rounded-xl bg-white p-4 shadow-sm">
        <div className="mb-2 flex items-center gap-3">
          <h2>Open action items{actions.length > 0 ? ` · ${actions.length}` : ""}</h2>
          <Link href="/notes?add=1&kind=action" className="ml-auto inline-flex min-h-10 items-center text-sm font-semibold text-green-600 underline">Add one</Link>
        </div>
        {actions.length === 0 ? (
          <p className="text-sm text-neutral-600">Nothing open. Add a note or action item after practice.</p>
        ) : (
          <ul className="space-y-2">
            {actions.slice(0, 5).map((n) => (
              <li key={n.id} className="text-sm">
                <Link href="/notes?show=open" className="block hover:underline">
                  {n.body.length > 90 ? `${n.body.slice(0, 90)}…` : n.body}
                  {n.due && <span className={`ml-2 text-xs ${isOverdue(n, today) ? "font-semibold text-red-800" : "text-neutral-500"}`}>{isOverdue(n, today) ? "Overdue · " : "Due "}{prettyDate(n.due)}</span>}
                </Link>
              </li>
            ))}
          </ul>
        )}
        {actions.length > 5 && <Link href="/notes?show=open" className="mt-2 inline-block text-sm text-green-600 underline">See all {actions.length}</Link>}
      </section>

      <section className="grid gap-4 sm:grid-cols-2">
        <Link href="/roster" className="rounded-xl bg-white p-4 shadow-sm hover:shadow">
          <h2 className="font-semibold">Team</h2>
          <p className="text-sm text-neutral-600">{players.length} players · {grade9} ninth · {grade8} eighth</p>
          <p className="mt-1 text-sm">{avail.out.length + avail.limited.length + avail.excused.length === 0 ? "Everyone available" : `${avail.out.length} out · ${avail.limited.length} limited · ${avail.excused.length} excused`}{next && next.date !== today ? " for next practice" : " today"}</p>
        </Link>
        <Link href="/practice" className="rounded-xl bg-white p-4 shadow-sm hover:shadow">
          <h2 className="font-semibold">This week’s practices</h2>
          <p className={`text-sm ${weekNeeds > 0 ? "font-semibold text-red-800" : "text-neutral-600"}`}>{weekNeeds > 0 ? `${weekNeeds} still need a plan` : "Everything is planned"}</p>
        </Link>
      </section>
    </div>
  );
}
