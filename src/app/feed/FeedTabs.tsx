"use client";

import { useMemo, useState } from "react";
import type { JournalEntryWithPhotos } from "@/db/queries";
import { EntryList } from "../EntryList";

type SortField = "entryDate" | "createdAt";
type SortOrder = "latest" | "oldest";

function sortEntries(entries: JournalEntryWithPhotos[], field: SortField, order: SortOrder) {
  const sorted = [...entries].sort((a, b) => {
    const aVal = field === "entryDate" ? a.entryDate : new Date(a.createdAt).getTime();
    const bVal = field === "entryDate" ? b.entryDate : new Date(b.createdAt).getTime();
    if (aVal < bVal) return -1;
    if (aVal > bVal) return 1;
    return 0;
  });
  if (order === "latest") sorted.reverse();
  return sorted;
}

export function FeedTabs({
  rounEntries,
  parentEntries,
  highlightEntryId,
}: {
  rounEntries: JournalEntryWithPhotos[];
  parentEntries: JournalEntryWithPhotos[];
  highlightEntryId?: number;
}) {
  const [tab, setTab] = useState<"roun" | "parents">(() =>
    highlightEntryId && parentEntries.some((e) => e.id === highlightEntryId) ? "parents" : "roun",
  );
  const [sortField, setSortField] = useState<SortField>("entryDate");
  const [sortOrder, setSortOrder] = useState<SortOrder>("latest");

  const entries = tab === "roun" ? rounEntries : parentEntries;
  const sortedEntries = useMemo(() => sortEntries(entries, sortField, sortOrder), [entries, sortField, sortOrder]);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex gap-2">
        <button
          onClick={() => setTab("roun")}
          className={`rounded-full px-4 py-1.5 font-heading text-sm font-semibold transition-transform hover:scale-105 active:scale-95 ${
            tab === "roun"
              ? "bg-emerald-600 text-white shadow-sm shadow-emerald-900/20"
              : "border border-emerald-100 text-emerald-800 dark:border-emerald-900/40 dark:text-emerald-200"
          }`}
        >
          🌱 로운
        </button>
        <button
          onClick={() => setTab("parents")}
          className={`rounded-full px-4 py-1.5 font-heading text-sm font-semibold transition-transform hover:scale-105 active:scale-95 ${
            tab === "parents"
              ? "bg-rose-500 text-white shadow-sm shadow-rose-900/20"
              : "border border-emerald-100 text-emerald-800 dark:border-emerald-900/40 dark:text-emerald-200"
          }`}
        >
          💌 엄마아빠
        </button>
      </div>

      <div className="flex flex-wrap gap-2 text-sm">
        <select
          value={sortField}
          onChange={(e) => setSortField(e.target.value as SortField)}
          className="rounded-2xl border border-emerald-100 bg-white px-3 py-1.5 text-xs dark:border-emerald-900/40 dark:bg-zinc-900"
        >
          <option value="entryDate">📅 Calendar date</option>
          <option value="createdAt">⏱️ Uploaded date</option>
        </select>
        <select
          value={sortOrder}
          onChange={(e) => setSortOrder(e.target.value as SortOrder)}
          className="rounded-2xl border border-emerald-100 bg-white px-3 py-1.5 text-xs dark:border-emerald-900/40 dark:bg-zinc-900"
        >
          <option value="latest">Latest first</option>
          <option value="oldest">Oldest first</option>
        </select>
      </div>

      <EntryList entries={sortedEntries} highlightEntryId={highlightEntryId} />
    </div>
  );
}
