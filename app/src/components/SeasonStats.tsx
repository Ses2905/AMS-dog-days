import { levelLabel, LEVELS } from "@/lib/games";
import type { Game } from "@/lib/db-types";
import { leaders, seasonRecords, type Play } from "@/lib/plays";
import type { Player } from "@/lib/types";

/** Records per team and scoring leaders, built from finished games and the scoring log. */
export function SeasonStats({ games, plays, players }: { games: Game[]; plays: Play[]; players: Player[] }) {
  const records = seasonRecords(games, LEVELS.map((l) => l.value));
  const top = leaders(plays, (id) => { const p = players.find((x) => x.id === id); return p ? `#${p.number} ${p.first} ${p.last}` : undefined; }).slice(0, 10);
  return (
    <section className="space-y-3 rounded-xl bg-white p-4 shadow-sm">
      <h2>Season</h2>
      {records.length === 0 ? (
        <p className="text-sm text-neutral-600">Records show up here once games are marked final with a score.</p>
      ) : (
        <div className="overflow-x-auto"><table className="w-full text-left text-sm">
          <thead><tr className="border-b border-neutral-300 text-xs uppercase tracking-wide text-neutral-600"><th className="py-1 pr-3">Team</th><th className="pr-3">Record</th><th className="pr-3">Points For</th><th>Points Against</th></tr></thead>
          <tbody>{records.map((r) => (
            <tr key={r.level} className="border-b border-neutral-100"><td className="py-2 pr-3 font-medium">{levelLabel(r.level as Game["level"])}</td><td className="pr-3 tabular-nums">{r.wins}-{r.losses}{r.ties ? `-${r.ties}` : ""}</td><td className="pr-3 tabular-nums">{r.pf}</td><td className="tabular-nums">{r.pa}</td></tr>
          ))}</tbody>
        </table></div>
      )}
      <h3 className="font-display text-lg font-semibold uppercase tracking-wide">Scoring Leaders</h3>
      {top.length === 0 ? (
        <p className="text-sm text-neutral-600">Log scores on a game page to see who is scoring.</p>
      ) : (
        <div className="overflow-x-auto"><table className="w-full text-left text-sm">
          <thead><tr className="border-b border-neutral-300 text-xs uppercase tracking-wide text-neutral-600"><th className="py-1 pr-3">Player</th><th className="pr-3">TD</th><th className="pr-3">FG</th><th className="pr-3">Conv.</th><th>Points</th></tr></thead>
          <tbody>{top.map((l) => (
            <tr key={l.key} className="border-b border-neutral-100"><td className="py-2 pr-3 font-medium">{l.name}</td><td className="pr-3 tabular-nums">{l.touchdowns}</td><td className="pr-3 tabular-nums">{l.fieldGoals}</td><td className="pr-3 tabular-nums">{l.conversions}</td><td className="font-semibold tabular-nums">{l.points}</td></tr>
          ))}</tbody>
        </table></div>
      )}
    </section>
  );
}
