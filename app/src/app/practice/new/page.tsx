import Link from "next/link";
import { connection } from "next/server";
import { PageHeader } from "@/components/PageHeader";
import { btnOutline, btnPrimary } from "@/components/ui";
import { getPractices } from "@/lib/db";
import { SESSION_CHOICES } from "@/lib/new-practice";
import { prettyDate } from "@/lib/time";
import { createPractice } from "./actions";
import { Icon } from "@/components/Icon";

export default async function NewPracticePage({ searchParams }: PageProps<"/practice/new">) {
  await connection();
  const { error, existing, date: qDate, session: qSession, from: qFrom } = await searchParams;
  const practices = (await getPractices()).sort((a, b) => b.date.localeCompare(a.date) || a.id.localeCompare(b.id));
  // Start on the day after the latest practice on file, since today's is the one most likely to exist already.
  const latest = practices[0]?.date ?? new Date().toLocaleDateString("en-CA", { timeZone: "America/Chicago" });
  const next = new Date(`${latest}T00:00:00Z`);
  next.setUTCDate(next.getUTCDate() + 1);
  const nextOpen = next.toISOString().slice(0, 10);
  const one = (v: string | string[] | undefined) => (typeof v === "string" ? v : "");
  const date = /^\d{4}-\d{2}-\d{2}$/.test(one(qDate)) ? one(qDate) : nextOpen;
  const sessionParam = one(qSession);
  const isStandard = (SESSION_CHOICES as readonly string[]).includes(sessionParam);
  const chosenFrom = practices.find((p) => p.id === one(qFrom)) ?? practices[0];
  const field = "mt-1 min-h-12 w-full rounded-lg border border-neutral-300 bg-white px-3 text-base";
  return (
    <div className="mx-auto max-w-xl space-y-4">
      <PageHeader title="Plan a Practice"><Link href="/practice" className={btnOutline}><Icon name="arrow-left" />Week View</Link></PageHeader>
      <form action={createPractice} className="space-y-4 rounded-xl bg-white p-4 shadow-sm">
        <label className="block text-sm font-medium">Date
          <input type="date" name="date" defaultValue={date} required className={field} />
        </label>
        <label className="block text-sm font-medium">Session
          <select name="session" defaultValue={isStandard ? sessionParam : "Evening"} className={field}>
            {SESSION_CHOICES.map((s) => <option key={s}>{s}</option>)}
          </select>
        </label>
        <label className="block text-sm font-medium">Or type a different name (optional)
          <input name="custom" maxLength={30} defaultValue={sessionParam && !isStandard ? sessionParam : ""} className={field} placeholder="e.g. Two-a-day, Walk-thru…" />
        </label>
        <label className="block text-sm font-medium">Copy the periods from
          <select name="from" defaultValue={chosenFrom?.id ?? ""} className={field}>
            {practices.map((p) => <option key={p.id} value={p.id}>{prettyDate(p.date)} · {p.session}</option>)}
            <option value="">Blank practice</option>
          </select>
        </label>
        <p className="rounded-lg bg-wash p-3 text-sm text-neutral-700">
          {chosenFrom ? <>Starts as a copy of <b>{prettyDate(chosenFrom.date)} · {chosenFrom.session}</b>: same periods, dress, lift, opponent and coaches. Notes start empty. The original is not changed.</> : "Starts blank."} Next you’ll adjust it in the editor and press Save.
        </p>
        {error && (
          <p role="alert" className="text-sm text-red-700">
            {error}{" "}
            {typeof existing === "string" && practices.some((p) => p.id === existing) && (
              <Link href={`/practice/${existing}`} className="font-semibold underline">Open It<Icon name="chevron-right" /></Link>
            )}
          </p>
        )}
        <button className={`${btnPrimary} w-full`}>Create Practice</button>
      </form>
    </div>
  );
}
