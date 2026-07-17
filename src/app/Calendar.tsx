"use client";

import { useMemo, useState } from "react";

const WEEKDAYS = ["S", "M", "T", "W", "T", "F", "S"];

function toISODate(year: number, month: number, day: number) {
  const mm = String(month + 1).padStart(2, "0");
  const dd = String(day).padStart(2, "0");
  return `${year}-${mm}-${dd}`;
}

export function Calendar({
  entryDates,
  selectedDate,
  onSelectDate,
}: {
  entryDates: Set<string>;
  selectedDate: string | null;
  onSelectDate: (date: string | null) => void;
}) {
  const today = new Date();
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());

  const todayISO = toISODate(today.getFullYear(), today.getMonth(), today.getDate());

  const cells = useMemo(() => {
    const firstWeekday = new Date(viewYear, viewMonth, 1).getDay();
    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
    const result: { day: number; iso: string }[] = [];
    for (let i = 0; i < firstWeekday; i++) result.push({ day: 0, iso: "" });
    for (let d = 1; d <= daysInMonth; d++) result.push({ day: d, iso: toISODate(viewYear, viewMonth, d) });
    return result;
  }, [viewYear, viewMonth]);

  function changeMonth(delta: number) {
    let m = viewMonth + delta;
    let y = viewYear;
    if (m < 0) {
      m = 11;
      y -= 1;
    } else if (m > 11) {
      m = 0;
      y += 1;
    }
    setViewMonth(m);
    setViewYear(y);
  }

  return (
    <div className="rounded-3xl border border-emerald-100/60 bg-white p-4 shadow-md shadow-emerald-900/5 dark:border-emerald-900/40 dark:bg-zinc-900 dark:shadow-black/40">
      <div className="mb-3 flex items-center justify-between">
        <button
          onClick={() => changeMonth(-1)}
          aria-label="Previous month"
          className="rounded-full px-2 py-1 text-sm text-emerald-700 transition-transform hover:scale-110 hover:bg-emerald-50 dark:text-emerald-300 dark:hover:bg-emerald-900/30"
        >
          ‹
        </button>
        <span className="font-heading text-sm font-semibold">
          {new Date(viewYear, viewMonth, 1).toLocaleDateString(undefined, {
            year: "numeric",
            month: "long",
          })}
        </span>
        <button
          onClick={() => changeMonth(1)}
          aria-label="Next month"
          className="rounded-full px-2 py-1 text-sm text-emerald-700 transition-transform hover:scale-110 hover:bg-emerald-50 dark:text-emerald-300 dark:hover:bg-emerald-900/30"
        >
          ›
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center text-xs text-emerald-900/40 dark:text-emerald-100/40">
        {WEEKDAYS.map((w, i) => (
          <div key={i} className="py-1">
            {w}
          </div>
        ))}
        {cells.map((cell, i) => {
          if (cell.day === 0) return <div key={i} />;
          const hasEntry = entryDates.has(cell.iso);
          const isSelected = selectedDate === cell.iso;
          const isToday = cell.iso === todayISO;
          return (
            <button
              key={i}
              onClick={() => onSelectDate(isSelected ? null : cell.iso)}
              className={`relative rounded-full py-1.5 text-sm transition-transform hover:scale-110 ${
                isSelected
                  ? "bg-emerald-600 text-white shadow-sm shadow-emerald-900/20"
                  : isToday
                    ? "bg-amber-200 text-amber-900 dark:bg-amber-900/60 dark:text-amber-200"
                    : "hover:bg-emerald-50 dark:hover:bg-emerald-900/30"
              }`}
            >
              {cell.day}
              {hasEntry && !isSelected && (
                <span className="absolute bottom-0.5 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full bg-emerald-500" />
              )}
            </button>
          );
        })}
      </div>

      {selectedDate && (
        <button
          onClick={() => onSelectDate(null)}
          className="mt-3 text-xs text-emerald-700/70 hover:text-emerald-900 dark:text-emerald-300/70 dark:hover:text-emerald-200"
        >
          Clear date filter
        </button>
      )}
    </div>
  );
}
