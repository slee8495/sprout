import { FamilySettingsForm } from "./FamilySettingsForm";

export default function SettingsPage() {
  return (
    <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 p-4 pb-24">
      <header className="pt-4">
        <h1 className="font-heading text-2xl font-bold text-emerald-700 dark:text-emerald-300">⚙️ Settings</h1>
      </header>
      <FamilySettingsForm mode="edit" />
    </div>
  );
}
