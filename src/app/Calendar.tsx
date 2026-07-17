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
    <div className="rounded-2xl border border-zinc-200 p-4 dark:border-zinc-800">
      <div className="mb-3 flex items-center justify-between">
        <button
          onClick={() => changeMonth(-1)}
          aria-label="Previous month"
          className="rounded-lg px-2 py-1 text-sm text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-900"
        >
          ‹
        </button>
        <span className="text-sm font-medium">
          {new Date(viewYear, viewMonth, 1).toLocaleDateString(undefined, {
            year: "numeric",
            month: "long",
          })}
        </span>
        <button
          onClick={() => changeMonth(1)}
          aria-label="Next month"
          className="rounded-lg px-2 py-1 text-sm text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-900"
        >
          ›
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center text-xs text-zinc-400">
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
              className={`relative rounded-lg py-1.5 text-sm ${
                isSelected
                  ? "bg-emerald-700 text-white"
                  : isToday
                    ? "bg-emerald-100 text-emerald-900 dark:bg-emerald-900 dark:text-emerald-200"
                    : "hover:bg-zinc-100 dark:hover:bg-zinc-900"
              }`}
            >
              {cell.day}
              {hasEntry && !isSelected && (
                <span className="absolute bottom-0.5 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full bg-emerald-600" />
              )}
            </button>
          );
        })}
      </div>

      {selectedDate && (
        <button
          onClick={() => onSelectDate(null)}
          className="mt-3 text-xs text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
        >
          Clear date filter
        </button>
      )}
    </div>
  );
}
