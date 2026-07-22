import { getFamilySettings } from "@/db/queries";
import { requireSession } from "@/lib/session";
import { InviteCodeCard } from "../InviteCodeCard";
import { FamilySettingsForm } from "./FamilySettingsForm";

export default async function SettingsPage() {
  const { familyId } = await requireSession();
  const settings = await getFamilySettings(familyId);

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 p-4 pb-24">
      <header className="pt-4">
        <h1 className="font-heading text-2xl font-bold text-emerald-700 dark:text-emerald-300">⚙️ Settings</h1>
      </header>
      <InviteCodeCard inviteCode={settings.inviteCode} />
      <FamilySettingsForm mode="edit" />
    </div>
  );
}
