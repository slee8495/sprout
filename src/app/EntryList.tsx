import type { JournalEntryWithPhotos } from "@/db/queries";
import { EntryCard } from "./EntryCard";

export function EntryList({ entries }: { entries: JournalEntryWithPhotos[] }) {
  if (entries.length === 0) {
    return (
      <p className="text-center text-sm text-zinc-500">
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
