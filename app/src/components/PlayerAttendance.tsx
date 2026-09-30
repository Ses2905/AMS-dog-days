import { MARK_LABEL, playerSummary, type Mark } from "@/lib/attendance";
import { prettyDate } from "@/lib/time";

/** A player's attendance so far. Excused days are shown but don't lower the percentage. */
export function PlayerAttendance({ rows }: { rows: { mark: Mark; date: string; session: string }[] }) {
  const s = playerSummary(rows);
  const misses = rows.filter((r) => r.mark === "absent").sort((a, b) => b.date.localeCompare(a.date)).slice(0, 5);
  return (
    <section className="space-y-2 rounded-xl bg-white p-4 shadow-sm">
      <h2>Attendance</h2>
      {s.total === 0 ? (
        <p className="text-sm text-neutral-600">No practices marked for him yet. Take attendance on a practice page.</p>
      ) : (
        <>
          <p><span className="font-display text-3xl font-semibold">{s.pct === null ? "–" : `${s.pct}%`}</span> <span className="text-sm text-neutral-600">there for {s.there} of {s.counted} practices{s.excused ? ` (${s.excused} excused not counted)` : ""}{s.late ? ` · ${s.late} late` : ""}</span></p>
          {misses.length > 0 && <p className="text-sm">Missed: {misses.map((m) => `${prettyDate(m.date)} ${m.session}`).join(", ")}</p>}
          <p className="text-xs text-neutral-600">{rows.length} marked: {(["present", "late", "absent", "excused"] as const).map((m) => `${rows.filter((r) => r.mark === m).length} ${MARK_LABEL[m].toLowerCase()}`).join(", ")}</p>
        </>
      )}
    </section>
  );
}
