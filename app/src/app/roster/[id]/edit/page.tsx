import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/PageHeader";
import { PlayerForm } from "@/components/PlayerForm";
import { btnOutline } from "@/components/ui";
import { PlayerNotes } from "@/components/PlayerNotes";
import { PlayerAttendance } from "@/components/PlayerAttendance";
import { getAttendance, getNotes, getPlayers, getPractices } from "@/lib/db";

export default async function EditPlayerPage({ params }: PageProps<"/roster/[id]/edit">) {
  const { id } = await params;
  const [players, allNotes, attendance, practices] = await Promise.all([getPlayers(), getNotes(), getAttendance(), getPractices()]);
  const player = players.find((p) => p.id === id);
  if (!player) notFound();
  return (
    <div className="space-y-4">
      <PageHeader title={`${player.first} ${player.last}`}><Link href="/roster" className={btnOutline}>Team</Link></PageHeader>
      <div className="mx-auto max-w-xl space-y-4"><PlayerForm player={player} players={players} /><PlayerAttendance rows={attendance.filter((a) => a.playerId === player.id).flatMap((a) => { const pr = practices.find((x) => x.id === a.practiceId); return pr ? [{ mark: a.mark, date: pr.date, session: pr.session }] : []; })} /><PlayerNotes playerId={player.id} notes={allNotes.filter((n) => n.playerId === player.id && n.kind === "note" && n.category)} /></div>
    </div>
  );
}
