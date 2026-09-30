import { notFound } from "next/navigation";
import { PracticeEditor } from "@/components/PracticeEditor";
import { getCoaches, getPractice } from "@/lib/db";
import { prettyDate } from "@/lib/time";

export default async function EditPracticePage({ params }: PageProps<"/practice/[id]/edit">) {
  const { id } = await params;
  const practice = await getPractice(id);
  if (!practice) notFound();
  const directory = (await getCoaches()).filter((c) => c.active).map((c) => c.last);
  return (
    <div className="space-y-4">
      <h1 className="text-3xl">Edit · {prettyDate(practice.date)} · {practice.session}</h1>
      <PracticeEditor practice={practice} directory={directory} />
    </div>
  );
}
