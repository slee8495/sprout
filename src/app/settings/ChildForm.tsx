"use client";

import { useState, useTransition } from "react";
import type { DayCountStart } from "@/lib/date";
import type { SubjectType } from "@/lib/milestones";
import { useSettings } from "../SettingsProvider";

export type ChildFormValues = {
  name: string;
  type: SubjectType;
  birthDate: string;
  dayCountStart: DayCountStart;
};

export function ChildForm({
  initial,
  submitLabel,
  onSubmit,
  onCancel,
}: {
  initial?: ChildFormValues;
  submitLabel: string;
  onSubmit: (input: ChildFormValues) => Promise<void>;
  onCancel?: () => void;
}) {
  const { t } = useSettings();
  const [name, setName] = useState(initial?.name ?? "");
  const [type, setType] = useState<SubjectType>(initial?.type ?? "child");
  const [birthDate, setBirthDate] = useState(initial?.birthDate ?? "");
  const [dayCountStart, setDayCountStart] = useState<DayCountStart>(initial?.dayCountStart ?? "zero");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      setError(t("Name is required."));
      return;
    }
    if (!birthDate) {
      setError(t("Pick a birth date."));
      return;
    }
    setError(null);
    startTransition(async () => {
      try {
        await onSubmit({ name: name.trim(), type, birthDate, dayCountStart });
      } catch (err) {
        setError(err instanceof Error ? err.message : t("Couldn't save — try again."));
      }
    });
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-3 rounded-2xl border border-emerald-100 p-3 dark:border-emerald-900/40"
    >
      <input
        type="text"
        placeholder={t("Name")}
        value={name}
        onChange={(e) => setName(e.target.value)}
        className="rounded-2xl border border-emerald-100 bg-white px-3 py-2 text-sm dark:border-emerald-900/40 dark:bg-zinc-900"
      />
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setType("child")}
          className={`flex-1 rounded-2xl border px-3 py-2 text-sm font-semibold transition-transform hover:scale-105 active:scale-95 ${
            type === "child"
              ? "border-emerald-600 bg-emerald-600 text-white"
              : "border-emerald-100 text-emerald-800 dark:border-emerald-900/40 dark:text-emerald-200"
          }`}
        >
          {t("👶 Child")}
        </button>
        <button
          type="button"
          onClick={() => setType("pet")}
          className={`flex-1 rounded-2xl border px-3 py-2 text-sm font-semibold transition-transform hover:scale-105 active:scale-95 ${
            type === "pet"
              ? "border-emerald-600 bg-emerald-600 text-white"
              : "border-emerald-100 text-emerald-800 dark:border-emerald-900/40 dark:text-emerald-200"
          }`}
        >
          {t("🐾 Pet")}
        </button>
      </div>
      <label className="flex flex-col gap-1 text-sm">
        {type === "pet" ? t("Birthday / adoption day") : t("Birth date")}
        <input
          type="date"
          value={birthDate}
          onChange={(e) => setBirthDate(e.target.value)}
          className="rounded-2xl border border-emerald-100 bg-white px-3 py-2 text-sm dark:border-emerald-900/40 dark:bg-zinc-900"
        />
      </label>
      <div className="flex flex-col gap-1 text-sm">
        {t("Day count starts at")}
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setDayCountStart("zero")}
            className={`flex-1 rounded-2xl border px-3 py-2 text-sm font-semibold transition-transform hover:scale-105 active:scale-95 ${
              dayCountStart === "zero"
                ? "border-emerald-600 bg-emerald-600 text-white"
                : "border-emerald-100 text-emerald-800 dark:border-emerald-900/40 dark:text-emerald-200"
            }`}
          >
            {t("Day 0 (born day = 0)")}
          </button>
          <button
            type="button"
            onClick={() => setDayCountStart("one")}
            className={`flex-1 rounded-2xl border px-3 py-2 text-sm font-semibold transition-transform hover:scale-105 active:scale-95 ${
              dayCountStart === "one"
                ? "border-emerald-600 bg-emerald-600 text-white"
                : "border-emerald-100 text-emerald-800 dark:border-emerald-900/40 dark:text-emerald-200"
            }`}
          >
            {t("Day 1 (born day = 1)")}
          </button>
        </div>
      </div>
      {error && <p className="text-sm text-rose-600">{error}</p>}
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={isPending}
          className="rounded-full bg-emerald-600 px-5 py-1.5 font-heading text-sm font-semibold text-white shadow-sm shadow-emerald-900/20 transition-transform hover:scale-105 hover:bg-emerald-700 active:scale-95 disabled:opacity-50 disabled:hover:scale-100"
        >
          {isPending ? t("Saving…") : submitLabel}
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="rounded-full border border-emerald-100 px-5 py-1.5 font-heading text-sm font-semibold text-emerald-800 transition-transform hover:scale-105 active:scale-95 dark:border-emerald-900/40 dark:text-emerald-200"
          >
            {t("Cancel")}
          </button>
        )}
      </div>
    </form>
  );
}
