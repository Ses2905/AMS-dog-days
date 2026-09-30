import Link from "next/link";
import type { ReactNode } from "react";
import { Icon } from "./Icon";

/**
 * The one list row. Left: a time or number. Middle: what it is (title) and one line about it (meta).
 * Right: a status only when something needs attention, then a chevron. The whole row is the tap target.
 */
export function Row({ href, lead, title, meta, status, tone = "normal", narrow = false, muted = false, onClick, expanded, chevron = true }: {
  href?: string;
  lead?: ReactNode;
  title: ReactNode;
  meta?: ReactNode;
  status?: ReactNode;
  tone?: "normal" | "game";
  /** Short leads (jersey numbers) get a narrower column so the title sits next to them. */
  narrow?: boolean;
  /** Past or finished items recede instead of carrying a "Done" label. */
  muted?: boolean;
  onClick?: () => void;
  expanded?: boolean;
  chevron?: boolean;
}) {
  const body = (
    <>
      {lead !== undefined && <span className={`font-display ${narrow ? "w-10" : "w-20"} shrink-0 whitespace-nowrap text-xl font-semibold leading-tight tabular-nums text-green-900`}>{lead}</span>}
      <span className="min-w-0 flex-1">
        <span className={`block text-base font-semibold leading-snug ${muted ? "text-neutral-600" : "text-ink"}`}>{title}</span>
        {meta && <span className="mt-0.5 block text-sm leading-snug text-neutral-600">{meta}</span>}
      </span>
      {status}
      {chevron && <Icon name={expanded ? "chevron-down" : "chevron-right"} size={20} className="text-neutral-400" />}
    </>
  );
  const cls = `flex min-h-16 w-full items-center gap-4 px-5 py-3 text-left transition-colors hover:bg-wash ${tone === "game" ? "bg-[#f6f1dc] hover:bg-[#efe8c9]" : ""}`;
  if (href) return <Link href={href} className={cls}>{body}</Link>;
  return <button type="button" onClick={onClick} aria-expanded={expanded} className={cls}>{body}</button>;
}

/** A white card that holds a titled group. Rows inside get hairline dividers. */
export function Section({ title, count, action, children, className = "" }: { title?: ReactNode; count?: number; action?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={`overflow-hidden rounded-2xl bg-white shadow-sm ${className}`}>
      {(title || action) && (
        <div className="flex min-h-14 items-center gap-3 border-b border-neutral-200 px-5 py-2">
          <h2 className="text-xl">{title}{count !== undefined && count > 0 && <span className="ml-2 font-sans text-base font-medium normal-case tracking-normal text-neutral-500">{count}</span>}</h2>
          {action && <div className="ml-auto">{action}</div>}
        </div>
      )}
      <div className="divide-y divide-neutral-200 [&>*]:border-0">{children}</div>
    </section>
  );
}
