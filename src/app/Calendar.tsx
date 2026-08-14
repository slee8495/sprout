"use client";

import { useMemo, useState } from "react";
import { todayInTimezone } from "@/lib/date";
import { useSettings } from "./SettingsProvider";

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
  const { timezone, t } = useSettings();
  const todayISO = todayInTimezone(timezone).iso;
  const [todayYear, todayMonth] = todayISO.split("-").map(Number);
  const [viewYear, setViewYear] = useState(todayYear);
  const [viewMonth, setViewMonth] = useState(todayMonth - 1);

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

  function jumpToMonth(value: string) {
    if (!value) return;
    const [y, m] = value.split("-").map(Number);
    setViewYear(y);
    setViewMonth(m - 1);
  }

  return (
    <div className="rounded-3xl border border-brand-100/60 bg-white p-4 shadow-md shadow-brand-900/5 dark:border-brand-900/40 dark:bg-zinc-900 dark:shadow-black/40">
      <div className="mb-3 flex items-center justify-between">
        <button
          onClick={() => changeMonth(-1)}
          aria-label={t("Previous month")}
          className="rounded-full px-2 py-1 text-sm text-brand-700 transition-transform hover:scale-110 hover:bg-brand-50 dark:text-brand-300 dark:hover:bg-brand-900/30"
        >
          ‹
        </button>
        <label className="relative cursor-pointer font-heading text-sm font-semibold">
          <span className="pointer-events-none">
            📅{" "}
            {new Date(viewYear, viewMonth, 1).toLocaleDateString(undefined, {
              year: "numeric",
              month: "long",
            })}
          </span>
          <input
            type="month"
            aria-label={t("Jump to month")}
            value={`${viewYear}-${String(viewMonth + 1).padStart(2, "0")}`}
            onChange={(e) => jumpToMonth(e.target.value)}
            className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
          />
        </label>
        <button
          onClick={() => changeMonth(1)}
          aria-label={t("Next month")}
          className="rounded-full px-2 py-1 text-sm text-brand-700 transition-transform hover:scale-110 hover:bg-brand-50 dark:text-brand-300 dark:hover:bg-brand-900/30"
        >
          ›
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center text-xs font-semibold text-brand-800/70 dark:text-brand-200/70">
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
                  ? "bg-brand-600 text-white shadow-sm shadow-brand-900/20"
                  : isToday
                    ? "bg-amber-200 text-amber-900 dark:bg-amber-900/60 dark:text-amber-200"
                    : "hover:bg-brand-50 dark:hover:bg-brand-900/30"
              }`}
            >
              {cell.day}
              {hasEntry && !isSelected && (
                <span className="absolute bottom-0.5 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full bg-brand-500" />
              )}
            </button>
          );
        })}
      </div>

      {selectedDate && (
        <button
          onClick={() => onSelectDate(null)}
          className="mt-3 text-xs text-brand-700/70 hover:text-brand-900 dark:text-brand-300/70 dark:hover:text-brand-200"
        >
          {t("Clear selected date")}
        </button>
      )}
    </div>
  );
}
