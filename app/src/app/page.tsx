import { connection } from "next/server";
import { TodayView } from "@/components/TodayView";
import { getAttendance, getGames, getNotes, getPlayers, getPractices } from "@/lib/db";
import { nowInSchool } from "@/lib/week";

export default async function Home() {
  await connection();
  const [practices, players, notes, games, attendance] = await Promise.all([getPractices(), getPlayers(), getNotes(), getGames(), getAttendance()]);
  return <TodayView now={nowInSchool()} practices={practices} games={games} notes={notes} players={players} attendance={attendance} />;
}
