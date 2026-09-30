import { connection } from "next/server";
import { GamesView } from "@/components/GamesView";
import { LinksEditor } from "@/components/LinksEditor";
import { SeasonStats } from "@/components/SeasonStats";
import { getAllPlayers, getGames, getPlays, getScheduleLinks } from "@/lib/db";
import { saveScheduleLinks } from "./actions";
import { nowInSchool } from "@/lib/week";

export default async function GamesPage() {
  await connection();
  const [games, links, plays, players] = await Promise.all([getGames(), getScheduleLinks(), getPlays(), getAllPlayers()]);
  return (
    <div className="space-y-4">
      <GamesView games={games} today={nowInSchool().today} />
      <SeasonStats games={games} plays={plays} players={players} />
      <LinksEditor initial={links} save={saveScheduleLinks} title="Schedules on the web" hint="Hudl and the school calendar" empty="Add the links to your team schedule pages so they are one tap away." />
    </div>
  );
}
