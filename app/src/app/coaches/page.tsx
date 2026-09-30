import Link from "next/link";
import { CoachManager } from "@/components/CoachManager";
import { getCoaches } from "@/lib/db";

export default async function CoachesPage() {
  const coaches = await getCoaches();
  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <div className="flex items-center gap-3"><h1 className="text-3xl">Coaches</h1><Link href="/roster" className="ml-auto text-sm text-green-600 underline">Back to the team</Link></div>
      <p className="text-sm text-neutral-600">The last names here become the columns on a practice plan. Tap a coach to edit.</p>
      <CoachManager coaches={coaches} />
    </div>
  );
}
