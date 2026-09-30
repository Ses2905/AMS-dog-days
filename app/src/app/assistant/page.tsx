import { connection } from "next/server";
import { AssistantView } from "@/components/AssistantView";
import { aiStatus } from "@/lib/ai/config";
import { DEFAULT_START } from "@/lib/new-practice";
import { nowInSchool } from "@/lib/week";

export const maxDuration = 60;

export default async function AssistantPage() {
  await connection();
  return <AssistantView ready={aiStatus().ready} today={nowInSchool().today} defaultStart={DEFAULT_START} />;
}
