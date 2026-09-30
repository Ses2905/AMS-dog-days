import { notFound } from "next/navigation";
import { PageHeader } from "@/components/PageHeader";
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
      <PageHeader title={`Edit · ${prettyDate(practice.date)} · ${practice.session}`} />
      <PracticeEditor practice={practice} directory={directory} />
    </div>
  );
}
