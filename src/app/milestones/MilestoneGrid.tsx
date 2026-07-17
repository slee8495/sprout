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
              className={`flex flex-col items-center gap-1 rounded-2xl border p-4 text-center ${
                entry
                  ? "border-emerald-300 bg-emerald-50 dark:border-emerald-800 dark:bg-emerald-950/40"
                  : "border-zinc-200 bg-zinc-50 opacity-50 dark:border-zinc-800 dark:bg-zinc-900"
              }`}
            >
              <span className="text-2xl">🏅</span>
              <span className="text-sm font-medium">{m.label}</span>
              <span className="text-xs text-zinc-500">
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
          <h2 className="text-sm font-semibold text-zinc-500">Other milestones</h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {otherEntries.map((entry) => {
              const key = `other-${entry.id}`;
              return (
                <button
                  key={entry.id}
                  onClick={() => setExpanded(expanded === key ? null : key)}
                  className="flex flex-col items-center gap-1 rounded-2xl border border-emerald-300 bg-emerald-50 p-4 text-center dark:border-emerald-800 dark:bg-emerald-950/40"
                >
                  <span className="text-2xl">🏅</span>
                  <span className="text-sm font-medium">{entry.milestoneLabel || "Milestone"}</span>
                  <span className="text-xs text-zinc-500">{formatEntryDate(entry.entryDate)}</span>
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
    <div className="rounded-2xl border border-zinc-200 p-4 dark:border-zinc-800">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-xs font-medium text-zinc-500">{formatEntryDate(entry.entryDate)}</span>
        <button onClick={onClose} className="text-xs text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300">
          ✕
        </button>
      </div>
      {entry.title && <h3 className="mb-1 font-semibold">{entry.title}</h3>}
      <p className="whitespace-pre-wrap text-sm text-zinc-700 dark:text-zinc-300">{entry.body}</p>
    </div>
  );
}
