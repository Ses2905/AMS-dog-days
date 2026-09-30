import { connection } from "next/server";
import { ScriptsView } from "@/components/ScriptsView";
import { getGames, getPractices, getScripts } from "@/lib/db";
import { vsLabel } from "@/lib/games";
import { prettyDate } from "@/lib/time";

export default async function ScriptsPage({ searchParams }: PageProps<"/scripts">) {
  await connection();
  const q = await searchParams;
  const one = (v: string | string[] | undefined) => (typeof v === "string" ? v : "");
  const [scripts, practices, games] = await Promise.all([getScripts(), getPractices(), getGames()]);
  return (
    <ScriptsView
      scripts={scripts}
      practices={[...practices].sort((a, b) => b.date.localeCompare(a.date) || b.id.localeCompare(a.id)).slice(0, 40).map((p) => ({ id: p.id, label: `${prettyDate(p.date)} · ${p.session}` }))}
      games={[...games].sort((a, b) => a.date.localeCompare(b.date)).map((g) => ({ id: g.id, label: `${vsLabel(g)} · ${prettyDate(g.date)}` }))}
      initial={{ add: one(q.add) === "1", practiceId: one(q.practice) || undefined, gameId: one(q.game) || undefined }}
    />
  );
}
