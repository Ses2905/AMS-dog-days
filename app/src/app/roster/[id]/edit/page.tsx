import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/PageHeader";
import { PlayerForm } from "@/components/PlayerForm";
import { btnOutline } from "@/components/ui";
import { PlayerNotes } from "@/components/PlayerNotes";
import { getNotes, getPlayers } from "@/lib/db";

export default async function EditPlayerPage({ params }: PageProps<"/roster/[id]/edit">) {
  const { id } = await params;
  const [players, allNotes] = await Promise.all([getPlayers(), getNotes()]);
  const player = players.find((p) => p.id === id);
  if (!player) notFound();
  return (
    <div className="space-y-4">
      <PageHeader title={`${player.first} ${player.last}`}><Link href="/roster" className={btnOutline}>Team</Link></PageHeader>
      <div className="mx-auto max-w-xl space-y-4"><PlayerForm player={player} players={players} /><PlayerNotes playerId={player.id} notes={allNotes.filter((n) => n.playerId === player.id && n.kind === "note" && n.category)} /></div>
    </div>
  );
}
