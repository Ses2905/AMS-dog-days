import { connection } from "next/server";
import { DepthChartView } from "@/components/DepthChartView";
import { getDepthChart, getNotes, getPlayers } from "@/lib/db";
import { nowInSchool } from "@/lib/week";

export default async function DepthPage() {
  await connection();
  const [chart, players, notes] = await Promise.all([getDepthChart(), getPlayers(), getNotes()]);
  const ideas: Record<string, string[]> = {};
  for (const n of notes) if (n.category === "position" && n.playerId) (ideas[n.playerId] ??= []).push(n.body);
  return <DepthChartView positions={chart.positions} slots={chart.slots} players={players} ideas={ideas} date={nowInSchool().today} />;
}
