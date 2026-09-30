import type { ReactNode } from "react";

const TONE = {
  green: "bg-green-900/10 text-green-900",
  solid: "bg-green-900 text-white",
  gold: "bg-gold-500 text-green-900",
  red: "bg-red-100 text-red-800",
  grey: "bg-neutral-200 text-neutral-800",
  quiet: "bg-neutral-100 text-neutral-600",
} as const;
export type PillTone = keyof typeof TONE;

/** Every status label, badge and count chip in the app is this one component, so they read the same everywhere. */
export function Pill({ tone = "grey", children, className = "" }: { tone?: PillTone; children: ReactNode; className?: string }) {
  return <span className={`inline-flex items-center whitespace-nowrap rounded-full px-2.5 py-0.5 font-sans text-xs font-semibold normal-case tracking-normal ${TONE[tone]} ${className}`}>{children}</span>;
}
