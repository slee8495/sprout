"use client";

import { useState, useTransition } from "react";
import { fill } from "@/lib/i18n";
import { useSettings } from "../SettingsProvider";
import { deleteAccountAction } from "./deleteAccountActions";

export function DeleteAccountCard({
  familyName,
  entries,
  photos,
  members,
}: {
  familyName: string;
  entries: number;
  photos: number;
  members: number;
}) {
  const { t } = useSettings();
  const [confirmText, setConfirmText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const canDelete = confirmText.trim() === familyName;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canDelete) return;
    setError(null);
    startTransition(async () => {
      try {
        await deleteAccountAction(confirmText);
      } catch (err) {
        setError(err instanceof Error ? err.message : t("Couldn't save — try again."));
      }
    });
  }

  return (
    <section className="flex flex-col gap-3 rounded-3xl border border-rose-300 bg-rose-50 p-4 dark:border-rose-900/50 dark:bg-rose-950/20">
      <h2 className="font-heading text-sm font-semibold text-rose-800 dark:text-rose-300">{t("Danger zone")}</h2>
      <p className="text-sm text-rose-700 dark:text-rose-300">
        {fill(
          t(
            "This will permanently delete {name} — {entries} entries, {photos} photos, {members} members — and cancel any active subscription. This cannot be undone.",
          ),
          { name: familyName, entries, photos, members },
        )}
      </p>
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <label className="flex flex-col gap-1 text-sm text-rose-700 dark:text-rose-300">
          {fill(t("Type {name} to confirm"), { name: familyName })}
          <input
            type="text"
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            className="rounded-2xl border border-rose-300 bg-white px-3 py-2 text-sm dark:border-rose-900/50 dark:bg-zinc-900"
          />
        </label>
        {error && <p className="text-sm text-rose-600">{error}</p>}
        <button
          type="submit"
          disabled={!canDelete || isPending}
          className="self-start rounded-full bg-rose-600 px-4 py-2 font-heading text-sm font-semibold text-white shadow-sm shadow-rose-900/20 transition-transform hover:scale-105 hover:bg-rose-700 active:scale-95 disabled:opacity-40 disabled:hover:scale-100"
        >
          {isPending ? t("Deleting…") : t("Permanently delete this family's account")}
        </button>
      </form>
    </section>
  );
}
