import { connection } from "next/server";
import { GamesView } from "@/components/GamesView";
import { getGames } from "@/lib/db";
import { nowInSchool } from "@/lib/week";

export default async function GamesPage() {
  await connection();
  return <GamesView games={await getGames()} today={nowInSchool().today} />;
}
