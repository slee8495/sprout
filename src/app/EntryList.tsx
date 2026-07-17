import type { JournalEntryWithPhotos } from "@/db/queries";
import { EntryCard } from "./EntryCard";

export function EntryList({ entries }: { entries: JournalEntryWithPhotos[] }) {
  if (entries.length === 0) {
    return (
      <p className="text-center font-heading text-sm text-emerald-900/60 dark:text-emerald-100/50">
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
