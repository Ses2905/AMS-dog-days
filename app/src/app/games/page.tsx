import { connection } from "next/server";
import { GamesView } from "@/components/GamesView";
import { LinksEditor } from "@/components/LinksEditor";
import { getGames, getScheduleLinks } from "@/lib/db";
import { saveScheduleLinks } from "./actions";
import { nowInSchool } from "@/lib/week";

export default async function GamesPage() {
  await connection();
  const [games, links] = await Promise.all([getGames(), getScheduleLinks()]);
  return (
    <div className="space-y-4">
      <GamesView games={games} today={nowInSchool().today} />
      <LinksEditor initial={links} save={saveScheduleLinks} title="Schedules on the web" hint="Hudl and the school calendar" empty="Add the links to your team schedule pages so they are one tap away." />
    </div>
  );
}
