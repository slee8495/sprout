"use client";

import { useMemo, useState } from "react";
import type { Child, JournalEntryWithPhotos } from "@/db/queries";
import { subjectEmoji } from "@/lib/milestones";
import { fill } from "@/lib/i18n";
import { EntryList } from "../EntryList";
import { useSettings } from "../SettingsProvider";

type SortField = "entryDate" | "createdAt";
type SortOrder = "latest" | "oldest";
type Tab = number | "parents";

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

function searchEntries(entries: JournalEntryWithPhotos[], query: string) {
  const q = query.trim().toLowerCase();
  if (!q) return entries;
  return entries.filter((entry) =>
    [entry.title, entry.body, entry.milestoneLabel].some((field) => field?.toLowerCase().includes(q)),
  );
}

export function FeedTabs({
  kids,
  childEntries,
  parentEntries,
  highlightEntryId,
}: {
  kids: Child[];
  childEntries: JournalEntryWithPhotos[];
  parentEntries: JournalEntryWithPhotos[];
  highlightEntryId?: number;
}) {
  const { t } = useSettings();
  const [tab, setTab] = useState<Tab>(() =>
    highlightEntryId && parentEntries.some((e) => e.id === highlightEntryId) ? "parents" : (kids[0]?.id ?? "parents"),
  );
  const [sortField, setSortField] = useState<SortField>("entryDate");
  const [sortOrder, setSortOrder] = useState<SortOrder>("latest");
  const [search, setSearch] = useState("");

  const entries = tab === "parents" ? parentEntries : childEntries.filter((entry) => entry.childId === tab);
  const searchedEntries = useMemo(() => searchEntries(entries, search), [entries, search]);
  const sortedEntries = useMemo(
    () => sortEntries(searchedEntries, sortField, sortOrder),
    [searchedEntries, sortField, sortOrder],
  );

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap gap-2">
        {kids.map((child) => (
          <button
            key={child.id}
            onClick={() => setTab(child.id)}
            className={`rounded-full px-4 py-1.5 font-heading text-sm font-semibold transition-transform hover:scale-105 active:scale-95 ${
              tab === child.id
                ? "bg-emerald-600 text-white shadow-sm shadow-emerald-900/20"
                : "border border-emerald-100 text-emerald-800 dark:border-emerald-900/40 dark:text-emerald-200"
            }`}
          >
            {subjectEmoji(child.type)} {child.name}
          </button>
        ))}
        <button
          onClick={() => setTab("parents")}
          className={`rounded-full px-4 py-1.5 font-heading text-sm font-semibold transition-transform hover:scale-105 active:scale-95 ${
            tab === "parents"
              ? "bg-rose-500 text-white shadow-sm shadow-rose-900/20"
              : "border border-emerald-100 text-emerald-800 dark:border-emerald-900/40 dark:text-emerald-200"
          }`}
        >
          {t("💌 Parents")}
        </button>
      </div>

      <input
        type="search"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder={t("🔍 Search entries…")}
        className="rounded-2xl border border-emerald-100 bg-white px-3 py-2 text-sm dark:border-emerald-900/40 dark:bg-zinc-900"
      />

      <div className="flex flex-wrap gap-2 text-sm">
        <select
          value={sortField}
          onChange={(e) => setSortField(e.target.value as SortField)}
          className="rounded-2xl border border-emerald-100 bg-white px-3 py-1.5 text-xs dark:border-emerald-900/40 dark:bg-zinc-900"
        >
          <option value="entryDate">{t("📅 Calendar date")}</option>
          <option value="createdAt">{t("⏱️ Uploaded date")}</option>
        </select>
        <select
          value={sortOrder}
          onChange={(e) => setSortOrder(e.target.value as SortOrder)}
          className="rounded-2xl border border-emerald-100 bg-white px-3 py-1.5 text-xs dark:border-emerald-900/40 dark:bg-zinc-900"
        >
          <option value="latest">{t("Latest first")}</option>
          <option value="oldest">{t("Oldest first")}</option>
        </select>
      </div>

      <EntryList
        entries={sortedEntries}
        highlightEntryId={highlightEntryId}
        emptyMessage={search.trim() ? fill(t('No results for "{query}" 🔍'), { query: search }) : undefined}
      />
    </div>
  );
}
