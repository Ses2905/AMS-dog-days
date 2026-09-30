import { connection } from "next/server";
import { PageHeader } from "@/components/PageHeader";
import { SharedLink } from "@/components/SharedLink";
import { getGames } from "@/lib/db";
import { nextGame, vsLabel } from "@/lib/games";
import { prettyDate } from "@/lib/time";
import { nowInSchool } from "@/lib/week";

/** Where a link lands when it's shared to the installed app from Hudl, Drive or a browser. */
export default async function SharePage({ searchParams }: PageProps<"/share">) {
  await connection();
  const q = await searchParams;
  const one = (v: string | string[] | undefined) => (typeof v === "string" ? v : "");
  // Some phones put the link in "text" instead of "url".
  const url = one(q.url) || (one(q.text).match(/https?:\/\/\S+/)?.[0] ?? "");
  const title = one(q.title) || (one(q.text).replace(/https?:\/\/\S+/, "").trim());
  const games = await getGames();
  const next = nextGame(games, nowInSchool().today);
  return (
    <div className="mx-auto max-w-xl space-y-4">
      <PageHeader title="Save This Link" />
      <SharedLink
        initialUrl={url} initialLabel={title.slice(0, 60)}
        games={[...games].sort((a, b) => b.date.localeCompare(a.date)).map((g) => ({ id: g.id, label: `${vsLabel(g)} · ${prettyDate(g.date)}` }))}
        defaultGameId={next?.id ?? ""}
      />
    </div>
  );
}
