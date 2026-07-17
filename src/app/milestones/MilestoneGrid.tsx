"use client";

import { useState } from "react";
import type { JournalEntryWithPhotos } from "@/db/queries";
import { MILESTONE_OPTIONS, formatEntryDate } from "@/lib/milestones";

export function MilestoneGrid({
  namedEntries,
  otherEntries,
}: {
  namedEntries: Record<string, JournalEntryWithPhotos | undefined>;
  otherEntries: JournalEntryWithPhotos[];
}) {
  const [expanded, setExpanded] = useState<string | null>(null);

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {MILESTONE_OPTIONS.filter((m) => m.value !== "other").map((m) => {
          const entry = namedEntries[m.value];
          const key = `named-${m.value}`;
          return (
            <button
              key={m.value}
              onClick={() => entry && setExpanded(expanded === key ? null : key)}
              className={`flex flex-col items-center gap-1 rounded-3xl border p-4 text-center shadow-md transition-transform hover:scale-105 ${
                entry
                  ? "border-amber-300 bg-amber-100 shadow-amber-900/10 dark:border-amber-800 dark:bg-amber-950/40"
                  : "border-emerald-100/60 bg-emerald-50/40 opacity-50 shadow-transparent dark:border-emerald-900/30 dark:bg-zinc-900"
              }`}
            >
              <span className="text-2xl">🏅</span>
              <span className="font-heading text-sm font-semibold">{m.label}</span>
              <span className="text-xs text-zinc-600 dark:text-zinc-400">
                {entry ? formatEntryDate(entry.entryDate) : "Not yet"}
              </span>
            </button>
          );
        })}
      </div>

      {expanded?.startsWith("named-") &&
        (() => {
          const value = expanded.replace("named-", "");
          const entry = namedEntries[value];
          if (!entry) return null;
          return <EntryDetail entry={entry} onClose={() => setExpanded(null)} />;
        })()}

      {otherEntries.length > 0 && (
        <div className="flex flex-col gap-3">
          <h2 className="font-heading text-sm font-bold text-zinc-600 dark:text-zinc-400">Other milestones</h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {otherEntries.map((entry) => {
              const key = `other-${entry.id}`;
              return (
                <button
                  key={entry.id}
                  onClick={() => setExpanded(expanded === key ? null : key)}
                  className="flex flex-col items-center gap-1 rounded-3xl border border-amber-300 bg-amber-100 p-4 text-center shadow-md shadow-amber-900/10 transition-transform hover:scale-105 dark:border-amber-800 dark:bg-amber-950/40"
                >
                  <span className="text-2xl">🏅</span>
                  <span className="font-heading text-sm font-semibold">{entry.milestoneLabel || "Milestone"}</span>
                  <span className="text-xs text-zinc-600 dark:text-zinc-400">{formatEntryDate(entry.entryDate)}</span>
                </button>
              );
            })}
          </div>
          {expanded?.startsWith("other-") &&
            (() => {
              const id = Number(expanded.replace("other-", ""));
              const entry = otherEntries.find((e) => e.id === id);
              if (!entry) return null;
              return <EntryDetail entry={entry} onClose={() => setExpanded(null)} />;
            })()}
        </div>
      )}
    </div>
  );
}

function EntryDetail({ entry, onClose }: { entry: JournalEntryWithPhotos; onClose: () => void }) {
  return (
    <div className="rounded-3xl border border-emerald-100/60 bg-white p-4 shadow-md shadow-emerald-900/5 dark:border-emerald-900/40 dark:bg-zinc-900 dark:shadow-black/40">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400">{formatEntryDate(entry.entryDate)}</span>
        <button onClick={onClose} className="text-xs text-zinc-500 dark:text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300">
          ✕
        </button>
      </div>
      {entry.title && <h3 className="mb-1 font-heading font-bold">{entry.title}</h3>}
      <p className="whitespace-pre-wrap text-sm text-zinc-800 dark:text-zinc-200">{entry.body}</p>
    </div>
  );
}
