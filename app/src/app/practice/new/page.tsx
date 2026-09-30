import Link from "next/link";
import { connection } from "next/server";
import { getPractices } from "@/lib/db";
import { SESSION_CHOICES } from "@/lib/new-practice";
import { prettyDate } from "@/lib/time";
import { createPractice } from "./actions";

export default async function NewPracticePage({ searchParams }: PageProps<"/practice/new">) {
  await connection();
  const { error, existing } = await searchParams;
  const practices = (await getPractices()).sort((a, b) => b.date.localeCompare(a.date) || a.id.localeCompare(b.id));
  // Start on the day after the latest practice on file, since today's is the one most likely to exist already.
  const latest = practices[0]?.date ?? new Date().toLocaleDateString("en-CA", { timeZone: "America/Chicago" });
  const next = new Date(`${latest}T00:00:00Z`);
  next.setUTCDate(next.getUTCDate() + 1);
  const today = next.toISOString().slice(0, 10);
  const field = "mt-1 min-h-12 w-full rounded-lg border border-neutral-300 bg-white px-3 text-base";
  return (
    <div className="mx-auto max-w-xl space-y-4">
      <h1 className="text-2xl font-semibold">New practice</h1>
      <form action={createPractice} className="space-y-4 rounded-xl bg-white p-4 shadow-sm">
        <label className="block text-sm font-medium">Date
          <input type="date" name="date" defaultValue={today} required className={field} />
        </label>
        <label className="block text-sm font-medium">Session
          <select name="session" defaultValue="Evening" className={field}>
            {SESSION_CHOICES.map((s) => <option key={s}>{s}</option>)}
          </select>
        </label>
        <label className="block text-sm font-medium">Or type a different name (optional)
          <input name="custom" maxLength={30} className={field} placeholder="Two-a-day, Walk-thru…" />
        </label>
        <label className="block text-sm font-medium">Start from
          <select name="from" defaultValue={practices[0]?.id ?? ""} className={field}>
            {practices.map((p) => <option key={p.id} value={p.id}>{prettyDate(p.date)} · {p.session}</option>)}
            <option value="">Blank practice</option>
          </select>
        </label>
        <p className="text-sm text-neutral-600">Copies the periods, dress, lift, opponent and coach columns. Notes start empty. You’ll land in the editor to adjust it.</p>
        {error && (
          <p role="alert" className="text-sm text-red-700">
            {error}{" "}
            {typeof existing === "string" && practices.some((p) => p.id === existing) && (
              <Link href={`/practice/${existing}`} className="font-semibold underline">Open it</Link>
            )}
          </p>
        )}
        <button className="min-h-12 w-full rounded-lg bg-green-900 font-semibold text-white">Create practice</button>
      </form>
    </div>
  );
}
