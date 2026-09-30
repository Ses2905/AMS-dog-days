import { roster } from "@/data/roster";

export default function RosterPage() {
  const players = [...roster.players].sort((a, b) => a.number - b.number);
  const flagged = players.filter((p) => p.otherNumbers.length > 0);
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Team · {players.length} players</h1>

      <section className="rounded-xl border border-gold-500 bg-[#f8f4e3] p-4">
        <h2 className="font-semibold">Needs your review before this roster is final</h2>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-sm">
          <li>
            <b>{flagged.length} players</b> have a different jersey number on another list (shown as “also #”). Confirm the right one.
          </li>
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

      <div className="overflow-x-auto rounded-xl bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead className="bg-green-900 text-left text-white">
            <tr><th className="px-3 py-2">#</th><th className="px-3 py-2">Player</th><th className="px-3 py-2">Grade</th><th className="px-3 py-2">Check</th></tr>
          </thead>
          <tbody>
            {players.map((p) => (
              <tr key={p.id} className="border-b border-neutral-200">
                <td className="px-3 py-2 font-mono tabular-nums">{p.number}</td>
                <td className="px-3 py-2 font-medium">{p.first} {p.last}</td>
                <td className="px-3 py-2">{p.grade}th</td>
                <td className="px-3 py-2 text-neutral-500">{p.otherNumbers.length ? `also #${p.otherNumbers.join(", #")}` : ""}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
