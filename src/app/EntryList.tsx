import type { JournalEntryWithPhotos } from "@/db/queries";
import { EntryCard } from "./EntryCard";

export function EntryList({ entries }: { entries: JournalEntryWithPhotos[] }) {
  if (entries.length === 0) {
    return (
      <p className="text-center font-heading text-sm font-semibold text-emerald-800 dark:text-emerald-200">
        No entries yet — write the first one above 🌱
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {entries.map((entry) => (
        <EntryCard key={entry.id} entry={entry} />
      ))}
    </div>
  );
}
