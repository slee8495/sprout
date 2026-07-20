import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { getFamilySettings, listMilestoneEntries } from "@/db/queries";
import { MilestoneGrid } from "./MilestoneGrid";

export default async function MilestonesPage() {
  const session = await auth();
  const familyId = session!.user!.familyId;

  const settings = await getFamilySettings(familyId);
  if (!settings.birthDate) redirect("/onboarding");

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
