"use client";

import type { JournalEntryWithPhotos } from "@/db/queries";
import { EntryCard } from "./EntryCard";
import { useSettings } from "./SettingsProvider";

export function EntryList({
  entries,
  highlightEntryId,
  emptyMessage,
}: {
  entries: JournalEntryWithPhotos[];
  highlightEntryId?: number;
  emptyMessage?: string;
}) {
  const { t } = useSettings();

  if (entries.length === 0) {
    return (
      <p className="text-center font-heading text-sm font-semibold text-emerald-800 dark:text-emerald-200">
        {emptyMessage ?? t("No entries yet — write the first one above 🌱")}
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {entries.map((entry) => (
        <EntryCard key={entry.id} entry={entry} highlighted={entry.id === highlightEntryId} />
      ))}
    </div>
  );
}
