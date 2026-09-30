import { connection } from "next/server";
import { HighSchoolRoster } from "@/components/HighSchoolRoster";
import { getHighSchoolPlayers } from "@/lib/db";

export default async function HighSchoolPage() {
  await connection();
  return <HighSchoolRoster players={await getHighSchoolPlayers()} />;
}
