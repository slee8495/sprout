import { auth } from "@/auth";
import { listJournalEntries } from "@/db/queries";
import { EntryList } from "../EntryList";

export default async function FeedPage() {
  const session = await auth();
  const entries = await listJournalEntries(session!.user!.familyId);

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 p-4 pb-24">
      <header className="pt-4">
        <h1 className="font-heading text-2xl font-bold text-emerald-700 dark:text-emerald-300">📸 Feed</h1>
      </header>
      <EntryList entries={entries} />
    </div>
  );
}
