import { redirect } from "next/navigation";
import { requireSession } from "@/lib/session";
import { getFamilySettings, listChildren } from "@/db/queries";
import { InviteCodeCard } from "../InviteCodeCard";
import { T } from "../T";
import { OnboardingForm } from "./OnboardingForm";

export default async function OnboardingPage() {
  const { familyId } = await requireSession();
  const [settings, kids] = await Promise.all([getFamilySettings(familyId), listChildren(familyId)]);
  if (kids.length > 0) redirect("/");

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 p-4 pb-24">
      <header className="pt-8 text-center">
        <h1 className="font-heading text-2xl font-bold text-emerald-700 dark:text-emerald-300">
          <T>🌱 Welcome to Sprout</T>
        </h1>
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
          <T>A few quick things before we start journaling.</T>
        </p>
      </header>
      <InviteCodeCard inviteCode={settings.inviteCode} />
      <OnboardingForm />
    </div>
  );
}
