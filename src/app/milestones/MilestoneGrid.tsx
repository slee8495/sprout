"use client";

import { useState } from "react";
import type { JournalEntryWithPhotos } from "@/db/queries";
import { MILESTONE_CATEGORIES, formatEntryDate } from "@/lib/milestones";
import { authorBadgeClasses } from "@/lib/author";
import { formatDayOfLife } from "@/lib/date";

export function MilestoneGrid({ entries }: { entries: JournalEntryWithPhotos[] }) {
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);

  const byCategory = new Map<string, JournalEntryWithPhotos[]>();
  for (const entry of entries) {
    if (!entry.milestoneCategory) continue;
    const list = byCategory.get(entry.milestoneCategory) ?? [];
    list.push(entry);
    byCategory.set(entry.milestoneCategory, list);
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {MILESTONE_CATEGORIES.map((c) => {
          const categoryEntries = byCategory.get(c.value) ?? [];
          const hasEntries = categoryEntries.length > 0;
          return (
            <button
              key={c.value}
              onClick={() => hasEntries && setExpandedCategory(expandedCategory === c.value ? null : c.value)}
              className={`flex flex-col items-center gap-1 rounded-3xl border p-4 text-center shadow-md transition-transform hover:scale-105 ${
                hasEntries
                  ? "border-amber-300 bg-amber-100 shadow-amber-900/10 dark:border-amber-800 dark:bg-amber-950/40"
                  : "border-emerald-100/60 bg-emerald-50/40 opacity-50 shadow-transparent dark:border-emerald-900/30 dark:bg-zinc-900"
              }`}
            >
              <span className="text-2xl">{c.emoji}</span>
              <span className="font-heading text-sm font-semibold">{c.label}</span>
              <span className="text-xs text-zinc-600 dark:text-zinc-400">
                {hasEntries ? `${categoryEntries.length}개` : "아직 없음"}
              </span>
            </button>
          );
        })}
      </div>

      {expandedCategory && (
        <div className="flex flex-col gap-3">
          {(byCategory.get(expandedCategory) ?? []).map((entry) => (
            <MilestoneDetail key={entry.id} entry={entry} />
          ))}
        </div>
      )}
    </div>
  );
}

function MilestoneDetail({ entry }: { entry: JournalEntryWithPhotos }) {
  return (
    <div className="rounded-3xl border border-emerald-100/60 bg-white p-4 shadow-md shadow-emerald-900/5 dark:border-emerald-900/40 dark:bg-zinc-900 dark:shadow-black/40">
      <div className="mb-2 flex flex-wrap items-center gap-2">
        {entry.author?.name && (
          <span
            className={`rounded-full px-2.5 py-0.5 font-heading text-xs font-semibold ${authorBadgeClasses(entry.author.name)}`}
          >
            {entry.author.name}
          </span>
        )}
        <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
          {formatEntryDate(entry.entryDate)}
        </span>
        <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">
          {formatDayOfLife(entry.entryDate)}
        </span>
      </div>
      <h3 className="mb-1 font-heading font-bold">{entry.milestoneLabel || "Milestone"}</h3>
      {entry.title && <p className="mb-1 text-sm font-semibold text-zinc-700 dark:text-zinc-300">{entry.title}</p>}
      <p className="whitespace-pre-wrap text-sm text-zinc-800 dark:text-zinc-200">{entry.body}</p>
    </div>
  );
}
