"use client";

import { chip } from "./ui";
import { Icon } from "./Icon";
type Option = { value: string; label: string };
export type FilterGroup = { label: string; value: string; options: Option[]; onChange: (v: string) => void };

/** Search, filter chips and a sort menu. The same bar sits above every list. */
export function ListToolbar({
  search, onSearch, placeholder, filters, sort, summary, onReset, canReset,
}: {
  search: string; onSearch: (v: string) => void; placeholder: string;
  filters: FilterGroup[];
  sort?: { value: string; options: Option[]; onChange: (v: string) => void };
  summary: string; onReset: () => void; canReset: boolean;
}) {
  return (
    <div className="space-y-3 rounded-xl bg-white p-3 shadow-sm">
      <div className="flex gap-2">
        <div className="relative min-w-0 flex-1">
          <Icon name="search" className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
          <input
            className="min-h-12 w-full rounded-lg border border-neutral-300 bg-white pl-10 pr-3 text-base"
            placeholder={placeholder} value={search} onChange={(e) => onSearch(e.target.value)} inputMode="search" aria-label="Search"
          />
        </div>
        {sort && (
          <label className="flex items-center gap-2 text-sm text-neutral-600">
            <span className="sr-only sm:not-sr-only">Sort by</span>
            <select className="min-h-12 rounded-lg border border-neutral-300 bg-white px-2 text-base text-ink" value={sort.value} onChange={(e) => sort.onChange(e.target.value)}>
              {sort.options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </label>
        )}
      </div>
      {filters.map((g) => (
        <div key={g.label} className="flex flex-wrap items-center gap-2">
          <span className="min-w-16 text-xs font-semibold uppercase tracking-wide text-neutral-500">{g.label}</span>
          {g.options.map((o) => (
            <button
              key={o.value} aria-pressed={g.value === o.value} onClick={() => g.onChange(o.value)}
              className={chip(g.value === o.value)}
            >
              {o.label}
            </button>
          ))}
        </div>
      ))}
      <p className="flex items-center gap-3 text-sm text-neutral-600">
        <span>{summary}</span>
        {canReset && <button className="inline-flex min-h-10 items-center gap-1.5 font-semibold text-green-600 underline" onClick={onReset}><Icon name="x" size={14} />Clear Filters</button>}
      </p>
    </div>
  );
}
