import { CoachesView } from "@/components/CoachManager";
import { getCoaches } from "@/lib/db";

export default async function CoachesPage() {
  return <CoachesView coaches={await getCoaches()} />;
}
