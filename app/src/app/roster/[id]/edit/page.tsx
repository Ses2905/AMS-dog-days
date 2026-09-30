import Link from "next/link";
import { notFound } from "next/navigation";
import { PlayerForm } from "@/components/PlayerForm";
import { getPlayers } from "@/lib/db";

export default async function EditPlayerPage({ params }: PageProps<"/roster/[id]/edit">) {
  const { id } = await params;
  const players = await getPlayers();
  const player = players.find((p) => p.id === id);
  if (!player) notFound();
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3"><h1 className="text-3xl">{player.first} {player.last}</h1><Link href="/roster" className="ml-auto text-sm text-green-600 underline">Back to the team</Link></div>
      <PlayerForm player={player} players={players} />
    </div>
  );
}
