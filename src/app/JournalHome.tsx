"use client";

import { useMemo, useRef, useState } from "react";
import type { Child, JournalEntryWithPhotos } from "@/db/queries";
import { Calendar } from "./Calendar";
import { DraftsList } from "./DraftsList";
import { EntryForm, type DraftEntryData } from "./EntryForm";
import { EntryList } from "./EntryList";
import { OnThisDay } from "./OnThisDay";
import { useSettings } from "./SettingsProvider";

export function JournalHome({
  kids,
  onThisDayEntries,
  childEntries,
  parentEntries,
  drafts,
}: {
  kids: Child[];
  onThisDayEntries: JournalEntryWithPhotos[];
  childEntries: JournalEntryWithPhotos[];
  parentEntries: JournalEntryWithPhotos[];
  drafts: DraftEntryData[];
}) {
  const { t, canEdit } = useSettings();
  const [selectedChildId, setSelectedChildId] = useState<number | undefined>(kids[0]?.id);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [resumingDraft, setResumingDraft] = useState<DraftEntryData | undefined>(undefined);
  const entryFormRef = useRef<HTMLDivElement>(null);
  const selectedChild = kids.find((k) => k.id === selectedChildId);

  const selectedChildEntries = useMemo(
    () => childEntries.filter((entry) => entry.children.some((c) => c.id === selectedChildId)),
    [childEntries, selectedChildId],
  );
  const childOnThisDay = useMemo(
    () => onThisDayEntries.filter((entry) => entry.children.some((c) => c.id === selectedChildId)),
    [onThisDayEntries, selectedChildId],
  );
  // Parents-only entries aren't tied to a specific child, so they show up regardless of
  // which child's tab is selected — the calendar/date list is "everything that day," not
  // just this child's milestones.
  const visibleEntries = useMemo(
    () => [...selectedChildEntries, ...parentEntries],
    [selectedChildEntries, parentEntries],
  );
  const entryDateSet = useMemo(() => new Set(visibleEntries.map((entry) => entry.entryDate)), [visibleEntries]);

  const selectedDateEntries = useMemo(
    () => (selectedDate ? visibleEntries.filter((entry) => entry.entryDate === selectedDate) : []),
    [visibleEntries, selectedDate],
  );

  return (
    <div className="flex flex-col gap-6">
      <header className="pt-4">
        <h1 className="font-heading text-2xl font-bold text-brand-700 dark:text-brand-300">
          🌱 {selectedChild ? `${selectedChild.name}${t("'s Journal")}` : t("Journal")}
        </h1>
        {kids.length > 1 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {kids.map((child) => (
              <button
                key={child.id}
                type="button"
                onClick={() => setSelectedChildId(child.id)}
                className={`rounded-full px-3 py-1.5 font-heading text-sm font-semibold transition-transform hover:scale-105 active:scale-95 ${
                  selectedChildId === child.id
                    ? "bg-brand-600 text-white shadow-sm shadow-brand-900/20"
                    : "border border-brand-100 text-brand-800 dark:border-brand-900/40 dark:text-brand-200"
                }`}
              >
                {child.name}
              </button>
            ))}
          </div>
        )}
      </header>
      {canEdit && (
        <DraftsList
          drafts={drafts}
          kids={kids}
          onResume={(draft) => {
            setResumingDraft(draft);
            entryFormRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
          }}
        />
      )}
      {childOnThisDay.length > 0 && <OnThisDay entries={childOnThisDay} />}
      <Calendar entryDates={entryDateSet} selectedDate={selectedDate} onSelectDate={setSelectedDate} />
      {canEdit && (
        <div ref={entryFormRef}>
          <EntryForm
            initialDate={selectedDate ?? undefined}
            kids={kids}
            defaultChildId={selectedChildId}
            draft={resumingDraft}
            onSaved={() => setResumingDraft(undefined)}
          />
        </div>
      )}
      {selectedDate && selectedDateEntries.length > 0 && (
        <div className="flex flex-col gap-3">
          <h2 className="font-heading text-sm font-semibold text-brand-800 dark:text-brand-200">
            {(() => {
              const [year, month, day] = selectedDate.split("-").map(Number);
              return new Date(year, month - 1, day).toLocaleDateString(undefined, {
                year: "numeric",
                month: "long",
                day: "numeric",
              });
            })()}
            {t("'s Feed")}
          </h2>
          <EntryList entries={selectedDateEntries} />
        </div>
      )}
    </div>
  );
}
