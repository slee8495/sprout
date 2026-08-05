"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import type { Child } from "@/db/queries";
import type { DraftEntryData } from "./EntryForm";
import { subjectEmoji } from "@/lib/milestones";
import { deleteEntry } from "./actions";
import { useSettings } from "./SettingsProvider";

export function DraftsList({
  drafts,
  kids,
  onResume,
}: {
  drafts: DraftEntryData[];
  kids: Child[];
  onResume: (draft: DraftEntryData) => void;
}) {
  const router = useRouter();
  const { t } = useSettings();
  const [isPending, startTransition] = useTransition();

  function handleDelete(id: number) {
    if (!confirm(t("Delete this draft? This can't be undone."))) return;
    startTransition(async () => {
      await deleteEntry(id);
      router.refresh();
    });
  }

  if (drafts.length === 0) return null;

  return (
    <div className="flex flex-col gap-2 rounded-3xl border border-amber-200 bg-amber-50 p-4 shadow-md shadow-amber-900/5 dark:border-amber-900 dark:bg-amber-950/40">
      <h2 className="font-heading text-sm font-bold text-amber-800 dark:text-amber-300">
        {t("📝 Drafts — only you can see these")}
      </h2>
      {drafts.map((draft) => {
        const child = draft.childId ? kids.find((k) => k.id === draft.childId) : undefined;
        return (
          <div key={draft.id} className="flex items-center justify-between gap-3 rounded-2xl bg-white/60 px-3 py-2 text-sm dark:bg-zinc-900/40">
            <div className="min-w-0 flex-1">
              <span className="font-medium text-amber-800 dark:text-amber-300">{draft.entryDate}</span>{" "}
              {child && (
                <span className="rounded-full bg-violet-100 px-2 py-0.5 text-xs font-semibold text-violet-800 dark:bg-violet-900/50 dark:text-violet-200">
                  {subjectEmoji(child.type)} {child.name}
                </span>
              )}{" "}
              <span className="truncate text-zinc-700 dark:text-zinc-300">
                {draft.title || draft.body || t("(empty draft)")}
              </span>
            </div>
            <div className="flex shrink-0 gap-3">
              <button
                type="button"
                onClick={() => onResume(draft)}
                className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 dark:text-emerald-300"
              >
                {t("Resume")}
              </button>
              <button
                type="button"
                onClick={() => handleDelete(draft.id)}
                disabled={isPending}
                className="text-xs text-rose-500 hover:text-rose-600 disabled:opacity-50"
              >
                {t("Delete")}
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
