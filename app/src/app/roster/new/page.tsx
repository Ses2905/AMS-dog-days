import Link from "next/link";
import { PlayerForm } from "@/components/PlayerForm";
import { getPlayers } from "@/lib/db";

export default async function NewPlayerPage() {
  const players = await getPlayers();
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3"><h1 className="text-3xl">Add a player</h1><Link href="/roster" className="ml-auto text-sm text-green-600 underline">Back to the team</Link></div>
      <PlayerForm players={players} />
    </div>
  );
}
