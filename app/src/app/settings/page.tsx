import { headers } from "next/headers";
import { connection } from "next/server";
import { CalendarLink } from "@/components/CalendarLink";
import { PageHeader } from "@/components/PageHeader";
import { Row, Section } from "@/components/Row";
import { createClient } from "@/lib/supabase/server";
import { aiStatus } from "@/lib/ai/config";
import { getCoaches, getDocuments, getGames, getPlayers, getScripts, getToolLinks } from "@/lib/db";
import { Icon } from "@/components/Icon";
import { Pill } from "@/components/Pill";
import { btnOutline } from "@/components/ui";

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
      <PageHeader title="Settings" subtitle="Your team, your data and your connections" />
      <Section title="Team">
        <Row href="/roster" title="Players" meta={`${players.length} on the Jr. High roster. Names, numbers, availability, coach notes.`} />
        <Row href="/roster/high-school" title="High School Roster" meta="Varsity and JV players." />
        <Row href="/coaches" title="Coaches" meta={`${coaches.filter((c) => c.active).length} active. These names become the columns on a practice plan.`} />
        <Row href="/depth" title="Depth Chart" meta="Who plays where, with backups and injuries flagged." />
      </Section>
      <Section title="Plans and Files">
        <Row href="/games" title="Schedule" meta={`${games.length} games. Add, edit, and keep the Hudl and school schedule links.`} />
        <Row href="/scripts" title="Scripts" meta={`${scripts.length} ${scripts.length === 1 ? "script" : "scripts"} of plays by situation.`} />
        <Row href="/documents" title="Library" meta={`${docs.length} ${docs.length === 1 ? "document" : "documents"} and film links.`} />
        <Row href="/tools" title="Tools" meta={`${tools.length} links to Hudl, SportsYou, Google and the rest.`} />
      </Section>
      <Section title="Assistant">
        <Row href="/assistant" title="Assistant" meta={ai.ready ? `On. Model: ${ai.model}. Players are shared as number and last name only, and parent notes never.` : "Off. Add AI_GATEWAY_API_KEY in Vercel to switch it on."} status={<Pill tone={ai.ready ? "green" : "grey"}>{ai.ready ? "On" : "Off"}</Pill>} />
      </Section>
      <Section title="Download Everything" action={<a href="/settings/export" download className={btnOutline}><Icon name="download" />Download</a>}>
        <p className="px-5 py-4 text-base text-neutral-700">All players, practices, games, scores, notes, scripts and the depth chart in one file. Your data is yours.</p>
      </Section>
      {token && host && <CalendarLink url={`${proto}://${host}/cal/${token}.ics`} />}
    </div>
  );
}
