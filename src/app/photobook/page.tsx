import Image from "next/image";
import { auth } from "@/auth";
import { listJournalEntries } from "@/db/queries";
import { MILESTONE_LABELS, formatEntryDate } from "@/lib/milestones";
import { PrintButton } from "./PrintButton";
import { YearSelect } from "./YearSelect";

export default async function PhotobookPage({
  searchParams,
}: {
  searchParams: Promise<{ year?: string }>;
}) {
  const session = await auth();
  const entries = await listJournalEntries(session!.user!.familyId);

  const years = Array.from(new Set(entries.map((e) => e.entryDate.slice(0, 4)))).sort().reverse();
  const { year: yearParam } = await searchParams;
  const year = yearParam ?? years[0] ?? String(new Date().getFullYear());

  const yearEntries = entries
    .filter((e) => e.entryDate.startsWith(year))
    .sort((a, b) => a.entryDate.localeCompare(b.entryDate));

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 p-4 pb-24 print:max-w-none print:p-0">
      <header className="flex items-center justify-between pt-4 print:hidden">
        <h1 className="font-heading text-2xl font-bold text-emerald-700 dark:text-emerald-300">📖 Photobook</h1>
        <div className="flex items-center gap-2">
          <YearSelect year={year} years={years} />
          <PrintButton />
        </div>
      </header>

      <section className="flex flex-col items-center gap-2 rounded-3xl border border-emerald-100/60 py-12 text-center shadow-md shadow-emerald-900/5 dark:border-emerald-900/40 dark:shadow-black/40 print:border-none print:py-24 print:shadow-none">
        <span className="text-3xl">🌱</span>
        <h2 className="font-heading text-2xl font-bold text-emerald-800 dark:text-emerald-200">
          Roun&apos;s Year — {year}
        </h2>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">{yearEntries.length} journal entries</p>
      </section>

      <div className="flex flex-col gap-8">
        {yearEntries.map((entry) => (
          <article
            key={entry.id}
            className="flex flex-col gap-2 border-b border-emerald-100 pb-8 last:border-0 dark:border-emerald-900/40 print:break-inside-avoid print:border-b-0 print:pb-4"
          >
            <div className="flex items-center gap-2 text-xs text-zinc-600 dark:text-zinc-400">
              <span>{formatEntryDate(entry.entryDate)}</span>
              {entry.milestoneType && (
                <span className="rounded-full bg-amber-200 px-2 py-0.5 font-heading font-semibold text-amber-900 dark:bg-amber-900/60 dark:text-amber-200">
                  🏅{" "}
                  {entry.milestoneType === "other"
                    ? entry.milestoneLabel || "Milestone"
                    : MILESTONE_LABELS[entry.milestoneType]}
                </span>
              )}
            </div>
            {entry.title && <h3 className="font-heading text-lg font-bold">{entry.title}</h3>}
            <p className="whitespace-pre-wrap text-sm text-zinc-800 dark:text-zinc-200">{entry.body}</p>
            {entry.photos.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {entry.photos.map((photo) => (
                  <Image
                    key={photo.id}
                    src={photo.url}
                    alt={photo.caption ?? ""}
                    width={200}
                    height={200}
                    className="h-40 w-40 rounded-2xl object-cover print:h-32 print:w-32"
                  />
                ))}
              </div>
            )}
          </article>
        ))}
        {yearEntries.length === 0 && (
          <p className="text-center text-sm text-zinc-600 dark:text-zinc-400">No entries for {year}.</p>
        )}
      </div>
    </div>
  );
}
