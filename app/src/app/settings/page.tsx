import Link from "next/link";
import { connection } from "next/server";
import { PageHeader } from "@/components/PageHeader";
import { aiStatus } from "@/lib/ai/config";
import { getCoaches, getDocuments, getGames, getPlayers, getScripts, getToolLinks } from "@/lib/db";

function Card({ href, title, detail, status }: { href: string; title: string; detail: string; status?: string }) {
  return (
    <Link href={href} className="flex min-h-24 flex-col justify-center gap-1 rounded-xl bg-white p-4 shadow-sm hover:shadow-md">
      <span className="flex items-center gap-2"><span className="font-display text-xl font-semibold uppercase tracking-wide">{title}</span>{status && <span className="rounded-full bg-neutral-200 px-2 py-0.5 text-xs font-semibold text-neutral-700">{status}</span>}</span>
      <span className="text-sm text-neutral-600">{detail}</span>
    </Link>
  );
}

export default async function SettingsPage() {
  await connection();
  const [players, coaches, games, docs, tools, scripts] = await Promise.all([getPlayers(), getCoaches(), getGames(), getDocuments(), getToolLinks(), getScripts()]);
  const ai = aiStatus();
  return (
    <div className="space-y-6">
      <PageHeader title="Settings" subtitle="The data everything else runs on" />
      <section className="space-y-2">
        <h2 className="text-xl">Team Data</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <Card href="/roster" title="Players" detail={`${players.length} on the roster. Names, numbers, grades, availability, coach notes.`} />
          <Card href="/coaches" title="Coaches" detail={`${coaches.filter((c) => c.active).length} active. These names become the columns on a practice plan.`} />
          <Card href="/games" title="Schedule" detail={`${games.length} games. Add, edit and keep the Hudl and school schedule links.`} />
          <Card href="/depth" title="Depth Chart" detail="Who plays where, by position, with backups and injuries flagged." />
          <Card href="/scripts" title="Scripts" detail={`${scripts.length} scripts of plays by situation.`} />
          <Card href="/documents" title="Library" detail={`${docs.length} documents and film links.`} />
        </div>
      </section>
      <section className="space-y-2">
        <h2 className="text-xl">Connections</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <Card href="/tools" title="Tools" detail={`${tools.length} links to Hudl, SportsYou, Google and the rest.`} />
          <Card href="/assistant" title="Assistant" detail={ai.ready ? `Model: ${ai.model}. Players are shared as number and last name only; parent notes never.` : "Add AI_GATEWAY_API_KEY in Vercel to switch it on."} status={ai.ready ? "On" : "Off"} />
        </div>
      </section>
    </div>
  );
}
