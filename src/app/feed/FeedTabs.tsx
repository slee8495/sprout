"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { Child, JournalEntryWithPhotos } from "@/db/queries";
import { subjectEmoji } from "@/lib/milestones";
import { fill } from "@/lib/i18n";
import { EntryList } from "../EntryList";
import { useSettings } from "../SettingsProvider";

type SortField = "entryDate" | "createdAt";
type SortOrder = "latest" | "oldest";
type Tab = number | "parents";

// Deep-linked from a push/in-app notification — resolves to whichever child/pet (or Parents)
// the linked entry actually belongs to, not just the first tab.
function resolveHighlightTab(
  highlightEntryId: number | undefined,
  childEntries: JournalEntryWithPhotos[],
  parentEntries: JournalEntryWithPhotos[],
): Tab | undefined {
  if (!highlightEntryId) return undefined;
  if (parentEntries.some((e) => e.id === highlightEntryId)) return "parents";
  const linkedChildEntry = childEntries.find((e) => e.id === highlightEntryId);
  return linkedChildEntry?.children[0]?.id ?? undefined;
}

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
  const [tab, setTab] = useState<Tab>(
    () => resolveHighlightTab(highlightEntryId, childEntries, parentEntries) ?? kids[0]?.id ?? "parents",
  );
  const [sortField, setSortField] = useState<SortField>("entryDate");
  const [sortOrder, setSortOrder] = useState<SortOrder>("latest");
  const [search, setSearch] = useState("");

  // Tapping a notification while already sitting on /feed re-renders this same component
  // instance with a new highlightEntryId (Next.js reuses it across same-route navigations) —
  // the useState initializer above only runs once on mount, so without this the tab silently
  // stays put. Track which highlight we've already applied so this doesn't fight manual
  // tab-switching on every re-render.
  const appliedHighlightRef = useRef(highlightEntryId);
  useEffect(() => {
    if (highlightEntryId === appliedHighlightRef.current) return;
    appliedHighlightRef.current = highlightEntryId;
    const resolved = resolveHighlightTab(highlightEntryId, childEntries, parentEntries);
    if (resolved !== undefined) setTab(resolved);
  }, [highlightEntryId, childEntries, parentEntries]);

  const entries =
    tab === "parents" ? parentEntries : childEntries.filter((entry) => entry.children.some((c) => c.id === tab));
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
                ? "bg-brand-600 text-white shadow-sm shadow-brand-900/20"
                : "border border-brand-100 text-brand-800 dark:border-brand-900/40 dark:text-brand-200"
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
              : "border border-brand-100 text-brand-800 dark:border-brand-900/40 dark:text-brand-200"
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
        className="rounded-2xl border border-brand-100 bg-white px-3 py-2 text-sm dark:border-brand-900/40 dark:bg-zinc-900"
      />

      <div className="flex flex-wrap gap-2 text-sm">
        <select
          value={sortField}
          onChange={(e) => setSortField(e.target.value as SortField)}
          className="rounded-2xl border border-brand-100 bg-white px-3 py-1.5 text-xs dark:border-brand-900/40 dark:bg-zinc-900"
        >
          <option value="entryDate">{t("📅 Calendar date")}</option>
          <option value="createdAt">{t("⏱️ Uploaded date")}</option>
        </select>
        <select
          value={sortOrder}
          onChange={(e) => setSortOrder(e.target.value as SortOrder)}
          className="rounded-2xl border border-brand-100 bg-white px-3 py-1.5 text-xs dark:border-brand-900/40 dark:bg-zinc-900"
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
