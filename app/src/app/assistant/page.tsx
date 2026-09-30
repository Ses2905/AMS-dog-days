import { connection } from "next/server";
import { AssistantView } from "@/components/AssistantView";
import { aiStatus } from "@/lib/ai/config";
import { getGames, getPlayers, getSavedOutputs } from "@/lib/db";
import { vsLabel } from "@/lib/games";
import { prettyDate } from "@/lib/time";
import { DEFAULT_START } from "@/lib/new-practice";
import { nowInSchool } from "@/lib/week";

export const maxDuration = 60;

export default async function AssistantPage() {
  await connection();
  const [games, players, saved] = await Promise.all([getGames(), getPlayers(), getSavedOutputs()]);
  return (
    <AssistantView
      ready={aiStatus().ready} today={nowInSchool().today} defaultStart={DEFAULT_START} saved={saved}
      games={[...games].sort((a, b) => a.date.localeCompare(b.date)).map((g) => ({ id: g.id, label: `${vsLabel(g)} · ${prettyDate(g.date)}` }))}
      players={[...players].sort((a, b) => a.number - b.number).map((p) => ({ id: p.id, label: `#${p.number} ${p.first} ${p.last}` }))}
    />
  );
}
