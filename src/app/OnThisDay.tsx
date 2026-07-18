import type { JournalEntryWithPhotos } from "@/db/queries";
import { formatEntryDate } from "@/lib/milestones";
import { authorBadgeClasses } from "@/lib/author";
import { formatDayOfLife } from "@/lib/date";

export function OnThisDay({ entries }: { entries: JournalEntryWithPhotos[] }) {
  return (
    <div className="flex flex-col gap-2 rounded-3xl border border-amber-200 bg-amber-50 p-4 shadow-md shadow-amber-900/5 dark:border-amber-900 dark:bg-amber-950/40">
      <h2 className="font-heading text-sm font-bold text-amber-800 dark:text-amber-300">✨ On this day</h2>
      {entries.map((entry) => (
        <div key={entry.id} className="text-sm">
          <span className="font-medium text-amber-700 dark:text-amber-400">
            {formatEntryDate(entry.entryDate)} ({formatDayOfLife(entry.entryDate)})
          </span>{" "}
          {entry.author?.name && (
            <span
              className={`mr-1 rounded-full px-2 py-0.5 font-heading text-xs font-semibold ${authorBadgeClasses(entry.author.name)}`}
            >
              {entry.author.name}
            </span>
          )}
          {entry.title && <span className="font-medium">{entry.title} — </span>}
          <span className="text-zinc-800 dark:text-zinc-200">{entry.body}</span>
        </div>
      ))}
    </div>
  );
}
