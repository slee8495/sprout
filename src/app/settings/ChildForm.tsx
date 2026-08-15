"use client";

import { useState, useTransition, type CSSProperties } from "react";
import type { DayCountStart } from "@/lib/date";
import { coverBackgroundHex, COVER_ANIMALS, COVER_BACKGROUNDS, type CoverBackground } from "@/lib/covers";
import { subjectEmoji, type SubjectType } from "@/lib/milestones";
import { CoverArt } from "../CoverArt";
import { useSettings } from "../SettingsProvider";

export type ChildFormValues = {
  name: string;
  type: SubjectType;
  birthDate: string;
  dayCountStart: DayCountStart;
  coverAnimal?: string;
  coverBackground?: string;
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
  const [coverAnimal, setCoverAnimal] = useState(initial?.coverAnimal ?? "");
  const [coverBackground, setCoverBackground] = useState<CoverBackground>(
    (initial?.coverBackground as CoverBackground) ?? COVER_BACKGROUNDS[0].value,
  );
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
        await onSubmit({ name: name.trim(), type, birthDate, dayCountStart, coverAnimal, coverBackground });
      } catch (err) {
        setError(err instanceof Error ? err.message : t("Couldn't save — try again."));
      }
    });
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-3 rounded-2xl border border-brand-100 p-3 dark:border-brand-900/40"
    >
      <input
        type="text"
        placeholder={t("Name")}
        value={name}
        onChange={(e) => setName(e.target.value)}
        className="rounded-2xl border border-brand-100 bg-white px-3 py-2 text-sm dark:border-brand-900/40 dark:bg-zinc-900"
      />
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setType("child")}
          className={`flex-1 rounded-2xl border px-3 py-2 text-sm font-semibold transition-transform hover:scale-105 active:scale-95 ${
            type === "child"
              ? "border-brand-600 bg-brand-600 text-white"
              : "border-brand-100 text-brand-800 dark:border-brand-900/40 dark:text-brand-200"
          }`}
        >
          {t("👶 Child")}
        </button>
        <button
          type="button"
          onClick={() => setType("pet")}
          className={`flex-1 rounded-2xl border px-3 py-2 text-sm font-semibold transition-transform hover:scale-105 active:scale-95 ${
            type === "pet"
              ? "border-brand-600 bg-brand-600 text-white"
              : "border-brand-100 text-brand-800 dark:border-brand-900/40 dark:text-brand-200"
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
          className="rounded-2xl border border-brand-100 bg-white px-3 py-2 text-sm dark:border-brand-900/40 dark:bg-zinc-900"
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
                ? "border-brand-600 bg-brand-600 text-white"
                : "border-brand-100 text-brand-800 dark:border-brand-900/40 dark:text-brand-200"
            }`}
          >
            {t("Day 0 (born day = 0)")}
          </button>
          <button
            type="button"
            onClick={() => setDayCountStart("one")}
            className={`flex-1 rounded-2xl border px-3 py-2 text-sm font-semibold transition-transform hover:scale-105 active:scale-95 ${
              dayCountStart === "one"
                ? "border-brand-600 bg-brand-600 text-white"
                : "border-brand-100 text-brand-800 dark:border-brand-900/40 dark:text-brand-200"
            }`}
          >
            {t("Day 1 (born day = 1)")}
          </button>
        </div>
      </div>
      <div className="flex flex-col gap-2 text-sm">
        {t("Album cover")}
        <div className="flex items-center gap-3">
          <span
            className="relative flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-[var(--cover-light)] text-3xl dark:bg-[var(--cover-dark)]"
            style={
              {
                "--cover-light": coverBackgroundHex(coverBackground, false),
                "--cover-dark": coverBackgroundHex(coverBackground, true),
              } as CSSProperties
            }
          >
            <CoverArt animal={coverAnimal} fallbackEmoji={subjectEmoji(type)} sizes="64px" />
          </span>
          <div className="flex flex-1 flex-wrap gap-1.5">
            {COVER_BACKGROUNDS.map((bg) => (
              <button
                key={bg.value}
                type="button"
                onClick={() => setCoverBackground(bg.value)}
                aria-label={t(bg.label)}
                className={`h-6 w-6 shrink-0 rounded-full border transition-transform hover:scale-110 active:scale-95 ${
                  coverBackground === bg.value ? "border-brand-700 ring-2 ring-brand-600 ring-offset-1" : "border-black/10"
                }`}
                style={{ backgroundColor: bg.light }}
              />
            ))}
          </div>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {COVER_ANIMALS.map((animal) => (
            <button
              key={animal}
              type="button"
              onClick={() => setCoverAnimal(animal)}
              className={`relative flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-xl border text-lg transition-transform hover:scale-110 active:scale-95 ${
                coverAnimal === animal
                  ? "border-brand-600 bg-brand-50 dark:bg-brand-900/30"
                  : "border-brand-100 dark:border-brand-900/40"
              }`}
            >
              <CoverArt animal={animal} fallbackEmoji={animal} sizes="36px" />
            </button>
          ))}
        </div>
        <p className="text-[11px] text-zinc-400 dark:text-zinc-500">
          {t("🎨 All illustrations used in this app are AI-generated.")}
        </p>
      </div>
      {error && <p className="text-sm text-rose-600">{error}</p>}
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={isPending}
          className="rounded-full bg-brand-600 px-5 py-1.5 font-heading text-sm font-semibold text-white shadow-sm shadow-brand-900/20 transition-transform hover:scale-105 hover:bg-brand-700 active:scale-95 disabled:opacity-50 disabled:hover:scale-100"
        >
          {isPending ? t("Saving…") : submitLabel}
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="rounded-full border border-brand-100 px-5 py-1.5 font-heading text-sm font-semibold text-brand-800 transition-transform hover:scale-105 active:scale-95 dark:border-brand-900/40 dark:text-brand-200"
          >
            {t("Cancel")}
          </button>
        )}
      </div>
    </form>
  );
}
