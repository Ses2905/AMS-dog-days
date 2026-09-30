import { connection } from "next/server";
import { CalendarView } from "@/components/CalendarView";
import { getGames, getPractices } from "@/lib/db";
import { isIso, type CalKind, type CalView } from "@/lib/calendar";
import { LEVELS } from "@/lib/games";
import { nowInSchool } from "@/lib/week";

export default async function CalendarPage({ searchParams }: PageProps<"/calendar">) {
  await connection();
  const q = await searchParams;
  const one = (v: string | string[] | undefined) => (typeof v === "string" ? v : "");
  const now = nowInSchool();
  const view: CalView = one(q.view) === "month" ? "month" : "week";
  const show: CalKind = one(q.show) === "practice" ? "practice" : one(q.show) === "game" ? "game" : "all";
  const level = LEVELS.find((l) => l.value === one(q.team))?.value ?? "all";
  const anchor = isIso(one(q.date)) ? one(q.date) : now.today;
  const [practices, games] = await Promise.all([getPractices(), getGames()]);
  return <CalendarView view={view} show={show} level={level} anchor={anchor} practices={practices} games={games} now={now} />;
}
