import { connection } from "next/server";
import { AvailabilitySummary } from "@/components/AvailabilitySummary";
import { TeamView } from "@/components/PlayerList";
import { getPlayers } from "@/lib/db";
import reviewNotes from "@/data/roster-review.json";

function distance(a: string, b: string) {
  const d = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array(b.length).fill(0)]);
  for (let j = 1; j <= b.length; j++) d[0][j] = j;
  for (let i = 1; i <= a.length; i++)
    for (let j = 1; j <= b.length; j++)
      d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
  return d[a.length][b.length];
}

export default async function RosterPage() {
  await connection();
  const today = new Date().toLocaleDateString("en-CA", { timeZone: "America/Chicago" });
  const players = await getPlayers();
  const roster = reviewNotes;
  // Same last name, same grade, first names within 2 letters: probably one kid spelled two ways.
  const lookAlikes = players.flatMap((a, i) =>
    players.slice(i + 1).filter((b) => a.last.toLowerCase() === b.last.toLowerCase() && a.grade === b.grade && distance(a.first.toLowerCase(), b.first.toLowerCase()) <= 2).map((b) => [a, b] as const),
  );
  const flagged = players.filter((p) => p.otherNumbers.length > 0);
  return (
    <TeamView players={players} today={today}>
      <AvailabilitySummary players={players} date={today} />

      <section className="rounded-xl border border-gold-500 bg-[#f8f4e3] p-4">
        <h2 className="font-semibold">Needs Your Review Before This Roster Is Final</h2>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-sm">
          <li>
            <b>{flagged.length} players</b> have a different jersey number on another list (shown as “also #”). Confirm the right one.
          </li>
          {lookAlikes.map(([a, b]) => (
            <li key={a.id + b.id}>
              “{a.first} {a.last}” (#{a.number}) and “{b.first} {b.last}” (#{b.number}) are both on the sign-out list. Same kid or two?
            </li>
          ))}
          {roster.nearDuplicates.map((d) => (
            <li key={d.first + d.last}>
              “{d.first} {d.last}” looks like the same kid as “{d.closest}” (also #{d.numbers.join(", ")}). Same player?
            </li>
          ))}
          <li>
            On other lists but not the sign-out list: {roster.notOnSignOut.map((p) => `${p.first} ${p.last} (#${p.numbers.join("/")})`).join(", ")}.
          </li>
        </ul>
      </section>
    </TeamView>
  );
}
