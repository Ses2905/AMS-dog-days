import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/PageHeader";
import { PlayerForm } from "@/components/PlayerForm";
import { btnOutline } from "@/components/ui";
import { getPlayers } from "@/lib/db";

export default async function EditPlayerPage({ params }: PageProps<"/roster/[id]/edit">) {
  const { id } = await params;
  const players = await getPlayers();
  const player = players.find((p) => p.id === id);
  if (!player) notFound();
  return (
    <div className="space-y-4">
      <PageHeader title={`${player.first} ${player.last}`}><Link href="/roster" className={btnOutline}>Team</Link></PageHeader>
      <div className="mx-auto max-w-xl"><PlayerForm player={player} players={players} /></div>
    </div>
  );
}
