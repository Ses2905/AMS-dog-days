import type { Practice } from "@/lib/types";
import { periodTimes } from "@/lib/time";

/** Time down the side, one lane per coach, 5-minute rows. Same layout on screen and in print. */
export function PracticeGrid({ practice, compact = false }: { practice: Practice; compact?: boolean }) {
  const { blocks } = practice;
  // Hide lanes nobody is assigned to (e.g. an assistant who isn't at this session).
  const coaches = practice.coaches.filter((c) => blocks.some((b) => b.lanes?.[c]));
  const cell = compact ? "px-1.5 py-[3px] text-[10px] leading-tight" : "px-3 py-2 text-sm";
  const startNumber = blocks.reduce<number[]>((acc, b, i) => [...acc, i === 0 ? 0 : acc[i - 1] + (blocks[i - 1].flex ? 0 : blocks[i - 1].periods)], []);
  return (
    <table className="w-full border-collapse table-fixed uppercase">
      <thead>
        <tr className="bg-green-900 text-white [print-color-adjust:exact] [-webkit-print-color-adjust:exact]">
          <th className={`${cell} w-14 text-left`}>Time</th>
          <th className={`${cell} w-8 text-left`}>#</th>
          {coaches.length === 0 && <th className={`${cell} text-center font-semibold uppercase tracking-wide`}>Everyone</th>}
          {coaches.map((c) => (
            <th key={c} className={`${cell} text-left font-semibold uppercase tracking-wide`}>{c}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {blocks.flatMap((b, bi) => {
          const times = periodTimes(b.start, b.periods);
          return times.map((t, i) => {
            const n = startNumber[bi] + i + 1;
            const first = i === 0;
            return (
              <tr key={`${bi}-${i}`} className={`border-b border-neutral-300 ${b.span ? "bg-[#f1ecd3] [print-color-adjust:exact] [-webkit-print-color-adjust:exact]" : ""}`}>
                <td className={`${cell} font-display text-lg font-semibold tabular-nums`}>{t}</td>
                <td className={`${cell} text-neutral-500`}>{b.flex ? "Flex" : n}</td>
                {b.span ? (
                  first ? (
                    <td colSpan={Math.max(coaches.length, 1)} rowSpan={b.periods} className={`${cell} text-center align-middle font-semibold uppercase tracking-wide`}>
                      {b.span}
                    </td>
                  ) : null
                ) : (
                  coaches.map((c, ci) => {
                    // Merge identical vertical runs inside a block so "Team O x3" reads as one cell.
                    const v = b.lanes?.[c] ?? "";
                    if (!first) return null;
                    return (
                      <td key={c} rowSpan={b.periods} className={`${cell} align-middle border-l border-neutral-200 ${ci === 0 ? "" : ""} ${v ? "font-medium" : "text-neutral-300"}`}>
                        {v || "–"}
                      </td>
                    );
                  })
                )}
              </tr>
            );
          });
        })}
      </tbody>
    </table>
  );
}

export function PracticeMeta({ practice, compact = false }: { practice: Practice; compact?: boolean }) {
  const items: [string, string | undefined][] = [
    ["Dress", practice.dress],
    ["Lift", practice.lift],
    ["Opponent", practice.opponent],
    ["O/D Meeting", practice.odMeeting],
    ["Situations", practice.situations],
  ];
  return (
    <dl className={`flex flex-wrap ${compact ? "gap-x-5 gap-y-1 text-xs" : "gap-x-8 gap-y-3"}`}>
      {items.filter(([, v]) => v).map(([k, v]) => (
        <div key={k} className={compact ? "flex gap-1.5" : "min-w-0"}>
          <dt className={`font-semibold uppercase tracking-wider text-green-900 ${compact ? "" : "text-xs"}`}>{k}</dt>
          <dd className={compact ? "" : "text-base font-medium"}>{v}</dd>
        </div>
      ))}
    </dl>
  );
}
