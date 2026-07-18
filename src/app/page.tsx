import { auth } from "@/auth";
import { getOnThisDayEntries, listEntryDates, listJournalEntries } from "@/db/queries";
import { todayInFamilyTimezone } from "@/lib/date";
import { JournalHome } from "./JournalHome";

export default async function Home() {
  const session = await auth();
  const familyId = session!.user!.familyId;

  const today = todayInFamilyTimezone();
  const [entryDates, onThisDayEntries, entries] = await Promise.all([
    listEntryDates(familyId, "roun"),
    getOnThisDayEntries(familyId, today.month, today.day, "roun"),
    listJournalEntries(familyId, "roun"),
  ]);

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 p-4 pb-24">
      <header className="pt-4">
        <h1 className="font-heading text-2xl font-bold text-emerald-700 dark:text-emerald-300">
          🌱 Roun&apos;s Journal
        </h1>
      </header>
      <JournalHome entryDates={entryDates} onThisDayEntries={onThisDayEntries} entries={entries} />
    </div>
  );
}
