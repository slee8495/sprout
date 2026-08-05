import { redirect } from "next/navigation";
import { listChildren, listMilestoneEntries } from "@/db/queries";
import { requireSession } from "@/lib/session";
import { MilestoneGrid } from "./MilestoneGrid";

export default async function MilestonesPage() {
  const { familyId } = await requireSession();

  const kids = await listChildren(familyId);
  if (kids.length === 0) redirect("/onboarding");

  const entries = await listMilestoneEntries(familyId);

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 p-4 pb-24">
      <header className="pt-4">
        <h1 className="font-heading text-2xl font-bold text-emerald-700 dark:text-emerald-300">🏅 Milestones</h1>
      </header>
      <MilestoneGrid entries={entries} />
    </div>
  );
}
