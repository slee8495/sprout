"use client";

import { useMemo, useState } from "react";
import type { JournalEntryWithPhotos } from "@/db/queries";
import { Calendar } from "./Calendar";
import { EntryForm } from "./EntryForm";
import { EntryList } from "./EntryList";
import { OnThisDay } from "./OnThisDay";

export function JournalHome({
  entries,
  onThisDayEntries,
}: {
  entries: JournalEntryWithPhotos[];
  onThisDayEntries: JournalEntryWithPhotos[];
}) {
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const entryDates = useMemo(() => new Set(entries.map((e) => e.entryDate)), [entries]);
  const filteredEntries = useMemo(
    () => (selectedDate ? entries.filter((e) => e.entryDate === selectedDate) : entries),
    [entries, selectedDate],
  );

  return (
    <div className="flex flex-col gap-6">
      {onThisDayEntries.length > 0 && <OnThisDay entries={onThisDayEntries} />}
      <Calendar entryDates={entryDates} selectedDate={selectedDate} onSelectDate={setSelectedDate} />
      <EntryForm initialDate={selectedDate ?? undefined} />
      {selectedDate && (
        <p className="text-sm text-zinc-500">
          Showing entries for {selectedDate} —{" "}
          <button onClick={() => setSelectedDate(null)} className="underline">
            show all
          </button>
        </p>
      )}
      <EntryList entries={filteredEntries} />
    </div>
  );
}
