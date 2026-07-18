"use client";

import { useState } from "react";
import type { JournalEntryWithPhotos } from "@/db/queries";
import { EntryList } from "../EntryList";

export function FeedTabs({
  rounEntries,
  parentEntries,
}: {
  rounEntries: JournalEntryWithPhotos[];
  parentEntries: JournalEntryWithPhotos[];
}) {
  const [tab, setTab] = useState<"roun" | "parents">("roun");

  return (
    <div className="flex flex-col gap-4">
      <div className="flex gap-2">
        <button
          onClick={() => setTab("roun")}
          className={`rounded-full px-4 py-1.5 font-heading text-sm font-semibold transition-transform hover:scale-105 active:scale-95 ${
            tab === "roun"
              ? "bg-emerald-600 text-white shadow-sm shadow-emerald-900/20"
              : "border border-emerald-100 text-emerald-800 dark:border-emerald-900/40 dark:text-emerald-200"
          }`}
        >
          🌱 로운
        </button>
        <button
          onClick={() => setTab("parents")}
          className={`rounded-full px-4 py-1.5 font-heading text-sm font-semibold transition-transform hover:scale-105 active:scale-95 ${
            tab === "parents"
              ? "bg-rose-500 text-white shadow-sm shadow-rose-900/20"
              : "border border-emerald-100 text-emerald-800 dark:border-emerald-900/40 dark:text-emerald-200"
          }`}
        >
          💌 엄마아빠
        </button>
      </div>
      <EntryList entries={tab === "roun" ? rounEntries : parentEntries} />
    </div>
  );
}
