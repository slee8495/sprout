import { redirect } from "next/navigation";
import { listChildren, listJournalEntries } from "@/db/queries";
import { requireSession } from "@/lib/session";
import { FeedTabs } from "./FeedTabs";

export default async function FeedPage({
  searchParams,
}: {
  searchParams: Promise<{ entry?: string }>;
}) {
  const { familyId } = await requireSession();

  const kids = await listChildren(familyId);
  if (kids.length === 0) redirect("/onboarding");

  const [childEntries, parentEntries, { entry }] = await Promise.all([
    listJournalEntries(familyId, "child"),
    listJournalEntries(familyId, "parents"),
    searchParams,
  ]);
  const highlightEntryId = entry ? Number(entry) : undefined;

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 p-4 pb-24">
      <header className="pt-4">
        <h1 className="font-heading text-2xl font-bold text-brand-700 dark:text-brand-300">📸 Feed</h1>
      </header>
      <FeedTabs
        kids={kids}
        childEntries={childEntries}
        parentEntries={parentEntries}
        highlightEntryId={highlightEntryId && !Number.isNaN(highlightEntryId) ? highlightEntryId : undefined}
      />
    </div>
  );
}
