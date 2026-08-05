import { redirect } from "next/navigation";
import { getFamilySettings, getOnThisDayEntries, listChildren, listJournalEntries, listMyDrafts } from "@/db/queries";
import { todayInTimezone } from "@/lib/date";
import { requireSession } from "@/lib/session";
import { JournalHome } from "./JournalHome";

export default async function Home() {
  const { userId, familyId } = await requireSession();
  const [settings, kids] = await Promise.all([getFamilySettings(familyId), listChildren(familyId)]);
  if (kids.length === 0) redirect("/onboarding");

  const today = todayInTimezone(settings.timezone);
  const [onThisDayEntries, childEntries, parentEntries, drafts] = await Promise.all([
    getOnThisDayEntries(familyId, today.month, today.day, "child"),
    listJournalEntries(familyId, "child"),
    listJournalEntries(familyId, "parents"),
    listMyDrafts(familyId, userId),
  ]);

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 p-4 pb-24">
      <JournalHome
        kids={kids}
        onThisDayEntries={onThisDayEntries}
        childEntries={childEntries}
        parentEntries={parentEntries}
        drafts={drafts}
      />
    </div>
  );
}
