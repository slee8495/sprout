import type { JournalEntryWithPhotos } from "@/db/queries";
import { formatEntryDate } from "@/lib/milestones";

export function OnThisDay({ entries }: { entries: JournalEntryWithPhotos[] }) {
  return (
    <div className="flex flex-col gap-2 rounded-2xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-900 dark:bg-amber-950/40">
      <h2 className="text-sm font-semibold text-amber-800 dark:text-amber-300">✨ On this day</h2>
      {entries.map((entry) => (
        <div key={entry.id} className="text-sm">
          <span className="font-medium text-amber-700 dark:text-amber-400">
            {formatEntryDate(entry.entryDate)}
          </span>{" "}
          {entry.title && <span className="font-medium">{entry.title} — </span>}
          <span className="text-zinc-700 dark:text-zinc-300">{entry.body}</span>
        </div>
      ))}
    </div>
  );
}
