import { auth } from "@/auth";
import { getOnThisDayEntries, listJournalEntries } from "@/db/queries";
import { JournalHome } from "./JournalHome";

export default async function Home() {
  const session = await auth();
  const familyId = session!.user!.familyId;

  const today = new Date();
  const [entries, onThisDayEntries] = await Promise.all([
    listJournalEntries(familyId),
    getOnThisDayEntries(familyId, today.getMonth() + 1, today.getDate()),
  ]);

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 p-4 pb-24">
      <header className="pt-4">
        <h1 className="font-heading text-2xl font-bold text-emerald-700 dark:text-emerald-300">
          🌱 Roun&apos;s Journal
        </h1>
      </header>
      <JournalHome entries={entries} onThisDayEntries={onThisDayEntries} />
    </div>
  );
}
