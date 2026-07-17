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
        <h1 className="text-xl font-semibold text-emerald-800 dark:text-emerald-400">📖 Photobook</h1>
        <div className="flex items-center gap-2">
          <YearSelect year={year} years={years} />
          <PrintButton />
        </div>
      </header>

      <section className="flex flex-col items-center gap-2 rounded-2xl border border-zinc-200 py-12 text-center dark:border-zinc-800 print:border-none print:py-24">
        <span className="text-3xl">🌱</span>
        <h2 className="text-2xl font-semibold">Roun&apos;s Year — {year}</h2>
        <p className="text-sm text-zinc-500">{yearEntries.length} journal entries</p>
      </section>

      <div className="flex flex-col gap-8">
        {yearEntries.map((entry) => (
          <article
            key={entry.id}
            className="flex flex-col gap-2 border-b border-zinc-200 pb-8 last:border-0 dark:border-zinc-800 print:break-inside-avoid print:border-b-0 print:pb-4"
          >
            <div className="flex items-center gap-2 text-xs text-zinc-500">
              <span>{formatEntryDate(entry.entryDate)}</span>
              {entry.milestoneType && (
                <span className="rounded-full bg-emerald-100 px-2 py-0.5 font-medium text-emerald-800 dark:bg-emerald-900 dark:text-emerald-300">
                  🏅{" "}
                  {entry.milestoneType === "other"
                    ? entry.milestoneLabel || "Milestone"
                    : MILESTONE_LABELS[entry.milestoneType]}
                </span>
              )}
            </div>
            {entry.title && <h3 className="text-lg font-semibold">{entry.title}</h3>}
            <p className="whitespace-pre-wrap text-sm text-zinc-700 dark:text-zinc-300">{entry.body}</p>
            {entry.photos.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {entry.photos.map((photo) => (
                  <Image
                    key={photo.id}
                    src={photo.url}
                    alt={photo.caption ?? ""}
                    width={200}
                    height={200}
                    className="h-40 w-40 rounded-lg object-cover print:h-32 print:w-32"
                  />
                ))}
              </div>
            )}
          </article>
        ))}
        {yearEntries.length === 0 && (
          <p className="text-center text-sm text-zinc-500">No entries for {year}.</p>
        )}
      </div>
    </div>
  );
}
