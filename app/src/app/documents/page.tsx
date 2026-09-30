import { connection } from "next/server";
import { DocumentsView } from "@/components/DocumentsView";
import { getDocuments, getGames, getPractices } from "@/lib/db";
import { CATEGORIES, type Category } from "@/lib/documents";
import { vsLabel } from "@/lib/games";
import { prettyDate } from "@/lib/time";

export const maxDuration = 60;

export default async function DocumentsPage({ searchParams }: PageProps<"/documents">) {
  await connection();
  const q = await searchParams;
  const one = (v: string | string[] | undefined) => (typeof v === "string" ? v : "");
  const [docs, games, practices] = await Promise.all([getDocuments(), getGames(), getPractices()]);
  const category = CATEGORIES.find((c) => c.value === one(q.category))?.value as Category | undefined;
  return (
    <DocumentsView
      docs={docs}
      lookups={{
        games: [...games].sort((a, b) => b.date.localeCompare(a.date)).map((g) => ({ id: g.id, label: `${vsLabel(g)} · ${prettyDate(g.date)}` })),
        practices: [...practices].sort((a, b) => b.date.localeCompare(a.date) || b.id.localeCompare(a.id)).slice(0, 40).map((p) => ({ id: p.id, label: `${prettyDate(p.date)} · ${p.session}` })),
      }}
      initial={{ add: one(q.add) === "1", gameId: one(q.game) || undefined, practiceId: one(q.practice) || undefined, category }}
    />
  );
}
