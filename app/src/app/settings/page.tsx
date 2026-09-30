import { headers } from "next/headers";
import Link from "next/link";
import { connection } from "next/server";
import { CalendarLink } from "@/components/CalendarLink";
import { PageHeader } from "@/components/PageHeader";
import { createClient } from "@/lib/supabase/server";
import { aiStatus } from "@/lib/ai/config";
import { getCoaches, getDocuments, getGames, getPlayers, getScripts, getToolLinks } from "@/lib/db";
import { Icon } from "@/components/Icon";
import { Pill } from "@/components/Pill";
import { btnOutline } from "@/components/ui";

function Card({ href, title, detail, status }: { href: string; title: string; detail: string; status?: string }) {
  return (
    <Link href={href} className="flex min-h-24 flex-col justify-center gap-1 rounded-xl bg-white p-4 shadow-sm hover:shadow-md">
      <span className="flex items-center gap-2"><span className="font-display text-xl font-semibold uppercase tracking-wide">{title}</span>{status && <Pill tone={status === "On" ? "green" : "grey"}>{status}</Pill>}</span>
      <span className="text-sm text-neutral-600">{detail}</span>
    </Link>
  );
}

export default async function SettingsPage() {
  await connection();
  const [players, coaches, games, docs, tools, scripts] = await Promise.all([getPlayers(), getCoaches(), getGames(), getDocuments(), getToolLinks(), getScripts()]);
  const ai = aiStatus();
  const supabase = await createClient();
  const tokenRow = await supabase.from("settings").select("value").eq("key", "calendar_token").maybeSingle();
  const token = typeof tokenRow.data?.value === "string" ? tokenRow.data.value : "";
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "";
  const proto = h.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
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
      <section className="flex flex-wrap items-center gap-3 rounded-xl bg-white p-4 shadow-sm">
        <div className="min-w-0 flex-1"><h2>Download Everything</h2><p className="text-sm text-neutral-600">All players, practices, games, scores, notes, scripts and the depth chart in one file. Your data is yours.</p></div>
        <a href="/settings/export" download className={btnOutline}><Icon name="download" />Download</a>
      </section>
      {token && host && <CalendarLink url={`${proto}://${host}/cal/${token}.ics`} />}
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
