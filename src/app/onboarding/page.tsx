import { redirect } from "next/navigation";
import { requireSession } from "@/lib/session";
import { getFamilySettings } from "@/db/queries";
import { FamilySettingsForm } from "../settings/FamilySettingsForm";

export default async function OnboardingPage() {
  const { familyId } = await requireSession();
  const settings = await getFamilySettings(familyId);
  if (settings.birthDate) redirect("/");

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 p-4 pb-24">
      <header className="pt-8 text-center">
        <h1 className="font-heading text-2xl font-bold text-emerald-700 dark:text-emerald-300">
          🌱 Welcome to Sprout
        </h1>
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
          A few quick things before we start journaling.
        </p>
      </header>
      <FamilySettingsForm mode="onboarding" />
    </div>
  );
}
