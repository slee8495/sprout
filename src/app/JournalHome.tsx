"use client";

import { useMemo, useState } from "react";
import type { JournalEntryWithPhotos } from "@/db/queries";
import { Calendar } from "./Calendar";
import { EntryForm } from "./EntryForm";
import { EntryList } from "./EntryList";
import { OnThisDay } from "./OnThisDay";

export function JournalHome({
  entryDates,
  onThisDayEntries,
  entries,
}: {
  entryDates: string[];
  onThisDayEntries: JournalEntryWithPhotos[];
  entries: JournalEntryWithPhotos[];
}) {
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const entryDateSet = useMemo(() => new Set(entryDates), [entryDates]);

  const selectedDateEntries = useMemo(
    () => (selectedDate ? entries.filter((entry) => entry.entryDate === selectedDate) : []),
    [entries, selectedDate],
  );

  return (
    <div className="flex flex-col gap-6">
      {onThisDayEntries.length > 0 && <OnThisDay entries={onThisDayEntries} />}
      <Calendar entryDates={entryDateSet} selectedDate={selectedDate} onSelectDate={setSelectedDate} />
      <EntryForm initialDate={selectedDate ?? undefined} />
      {selectedDate && selectedDateEntries.length > 0 && (
        <div className="flex flex-col gap-3">
          <h2 className="font-heading text-sm font-semibold text-emerald-800 dark:text-emerald-200">
            {(() => {
              const [year, month, day] = selectedDate.split("-").map(Number);
              return new Date(year, month - 1, day).toLocaleDateString(undefined, {
                year: "numeric",
                month: "long",
                day: "numeric",
              });
            })()}
            의 피드
          </h2>
          <EntryList entries={selectedDateEntries} />
        </div>
      )}
    </div>
  );
}
