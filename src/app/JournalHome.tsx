"use client";

import { useMemo, useState } from "react";
import type { JournalEntryWithPhotos } from "@/db/queries";
import { Calendar } from "./Calendar";
import { EntryForm } from "./EntryForm";
import { OnThisDay } from "./OnThisDay";

export function JournalHome({
  entryDates,
  onThisDayEntries,
}: {
  entryDates: string[];
  onThisDayEntries: JournalEntryWithPhotos[];
}) {
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const entryDateSet = useMemo(() => new Set(entryDates), [entryDates]);

  return (
    <div className="flex flex-col gap-6">
      {onThisDayEntries.length > 0 && <OnThisDay entries={onThisDayEntries} />}
      <Calendar entryDates={entryDateSet} selectedDate={selectedDate} onSelectDate={setSelectedDate} />
      <EntryForm initialDate={selectedDate ?? undefined} />
    </div>
  );
}
