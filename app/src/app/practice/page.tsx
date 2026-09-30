import { connection } from "next/server";
import { WeekView } from "@/components/WeekView";
import { getPractices } from "@/lib/db";
import { mondayOf, nowInSchool } from "@/lib/week";

export default async function PracticeWeek({ searchParams }: PageProps<"/practice">) {
  await connection();
  const { week } = await searchParams;
  const now = nowInSchool();
  const valid = typeof week === "string" && /^\d{4}-\d{2}-\d{2}$/.test(week) && !Number.isNaN(new Date(`${week}T00:00:00Z`).getTime());
  const monday = mondayOf(valid ? week : now.today);
  return <WeekView practices={await getPractices()} monday={monday} now={now} />;
}
