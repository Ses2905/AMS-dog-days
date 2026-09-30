import { availabilityOn } from "@/lib/availability";
import type { Player } from "@/lib/types";

const names = (ps: Player[]) => ps.map((p) => `#${p.number} ${p.first} ${p.last}`).join(", ");

/** Who is out, limited or excused on a given date. Renders nothing when everyone is available. */
export function AvailabilitySummary({ players, date, compact = false }: { players: Player[]; date: string; compact?: boolean }) {
  const a = availabilityOn(players, date);
  const groups = [["Out", a.out], ["Limited", a.limited], ["Excused", a.excused]] as const;
  const shown = groups.filter(([, ps]) => ps.length > 0);
  if (shown.length === 0) return compact ? null : <p className="text-sm text-neutral-600">Everyone on the roster is available.</p>;
  if (compact)
    return (
      <p className="mt-1 text-[10px] leading-snug">
        {shown.map(([label, ps]) => <span key={label} className="mr-3"><b className="uppercase tracking-wide text-green-900">{label} ({ps.length}):</b> {names(ps)}</span>)}
      </p>
    );
  return (
    <section className="space-y-2 rounded-xl bg-white p-4 shadow-sm">
      <h2 className="font-semibold">Availability · {a.available} of {a.total} available</h2>
      {shown.map(([label, ps]) => (
        <p key={label} className="text-sm"><b>{label} ({ps.length}):</b> {names(ps)}</p>
      ))}
    </section>
  );
}
