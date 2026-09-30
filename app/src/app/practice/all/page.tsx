import { PracticeListView } from "@/components/PracticeListView";
import { getPractices } from "@/lib/db";

export default async function AllPractices() {
  return <PracticeListView practices={await getPractices()} />;
}
