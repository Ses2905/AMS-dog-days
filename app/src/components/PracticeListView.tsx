"use client";

import Link from "next/link";
import { useState } from "react";
import { filterPractices, NO_PRACTICE_FILTERS, sortPractices, type PracticeFilters, type PracticeSort } from "@/lib/lists";
import { prettyDate } from "@/lib/time";
import type { Practice } from "@/lib/types";
import { ListToolbar } from "./ListToolbar";
import { PageHeader } from "./PageHeader";
import { btnOutline, btnPrimary } from "./ui";
import { Icon } from "./Icon";

const SORTS: { value: PracticeSort; label: string }[] = [{ value: "newest", label: "Newest first" }, { value: "oldest", label: "Oldest first" }];

export function PracticeListView({ practices }: { practices: Practice[] }) {
  const [filters, setFilters] = useState<PracticeFilters>(NO_PRACTICE_FILTERS);
  const [sort, setSort] = useState<PracticeSort>("newest");
  const sessions = [...new Set(practices.map((p) => p.session))];
  const list = sortPractices(filterPractices(practices, filters), sort);
  const filtered = JSON.stringify(filters) !== JSON.stringify(NO_PRACTICE_FILTERS);

  return (
    <div className="space-y-4">
      <PageHeader title={`All practices · ${practices.length}`}>
        <Link href="/practice" className={btnOutline}><Icon name="arrow-left" />Week View</Link>
        <Link href="/practice/new" className={btnPrimary}><Icon name="plus" />Plan a Practice</Link>
      </PageHeader>

      <ListToolbar
        search={filters.q} onSearch={(v) => setFilters((f) => ({ ...f, q: v }))} placeholder="Find by date, session or opponent"
        sort={{ value: sort, options: SORTS, onChange: (v) => setSort(v as PracticeSort) }}
        filters={[
          { label: "Session", value: filters.session, onChange: (v) => setFilters((f) => ({ ...f, session: v })), options: [{ value: "all", label: "All" }, ...sessions.map((s) => ({ value: s, label: s }))] },
          { label: "Check", value: filters.review ? "review" : "all", onChange: (v) => setFilters((f) => ({ ...f, review: v === "review" })), options: [{ value: "all", label: "All" }, { value: "review", label: "Needs review" }] },
        ]}
        summary={`Showing ${list.length} of ${practices.length}`} canReset={filtered} onReset={() => setFilters(NO_PRACTICE_FILTERS)}
      />

      <ul className="divide-y divide-neutral-200 overflow-hidden rounded-2xl bg-white shadow-sm">
        {list.map((p) => (
          <li key={p.id}>
            <Link href={`/practice/${p.id}`} className="flex min-h-14 items-center justify-between gap-3 px-4 py-3 hover:bg-wash">
              <span>
                <span className="font-medium">{prettyDate(p.date)}</span>
                <span className="text-neutral-500"> · {p.session}</span>
                {p.imported && <span className="ml-2 rounded bg-[#f8f4e3] px-1.5 text-xs text-neutral-600">review</span>}
              </span>
              <span className="text-sm text-neutral-500">{[p.dress, p.opponent && `vs ${p.opponent}`].filter(Boolean).join(" · ")}</span>
            </Link>
          </li>
        ))}
        {list.length === 0 && <li className="px-4 py-6 text-center text-sm text-neutral-500">No practices match.</li>}
      </ul>
    </div>
  );
}
