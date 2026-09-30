import type { ReactNode } from "react";

/**
 * Every page starts the same way: title on the left, actions on the right.
 * Convention: the main action ("Add …", "Plan a practice") is always the last, right-most button; secondary links come before it.
 */
export function PageHeader({ title, subtitle, children }: { title: string; subtitle?: string; children?: ReactNode }) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="min-w-0">
        <h1 className="text-3xl">{title}</h1>
        {subtitle && <p className="text-sm text-neutral-600">{subtitle}</p>}
      </div>
      {children && <div className="ml-auto flex flex-wrap gap-2">{children}</div>}
    </div>
  );
}
