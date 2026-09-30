import { notFound } from "next/navigation";
import { PracticeEditor } from "@/components/PracticeEditor";
import { getPractice } from "@/lib/db";
import { prettyDate } from "@/lib/time";

export default async function EditPracticePage({ params }: PageProps<"/practice/[id]/edit">) {
  const { id } = await params;
  const practice = await getPractice(id);
  if (!practice) notFound();
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Edit · {prettyDate(practice.date)} · {practice.session}</h1>
      <PracticeEditor practice={practice} />
    </div>
  );
}
