import { connection } from "next/server";
import { notFound } from "next/navigation";
import { ScriptEditor, ScriptSideline } from "@/components/ScriptEditor";
import { getGames, getPractices, getScript } from "@/lib/db";
import { vsLabel } from "@/lib/games";
import { prettyDate } from "@/lib/time";

export default async function ScriptPage({ params, searchParams }: PageProps<"/scripts/[id]">) {
  await connection();
  const [{ id }, q] = await Promise.all([params, searchParams]);
  const script = await getScript(id);
  if (!script) notFound();
  if (q.view === "sideline") return <ScriptSideline script={script} />;
  const [practices, games] = await Promise.all([getPractices(), getGames()]);
  return (
    <ScriptEditor
      script={script}
      practices={[...practices].sort((a, b) => b.date.localeCompare(a.date) || b.id.localeCompare(a.id)).slice(0, 40).map((p) => ({ id: p.id, label: `${prettyDate(p.date)} · ${p.session}` }))}
      games={[...games].sort((a, b) => a.date.localeCompare(b.date)).map((g) => ({ id: g.id, label: `${vsLabel(g)} · ${prettyDate(g.date)}` }))}
    />
  );
}
