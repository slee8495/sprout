"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { DayCountStart } from "@/lib/date";
import type { SubjectType } from "@/lib/milestones";
import { useSettings, type FontSize, type Locale, type Theme } from "../SettingsProvider";
import { completeOnboarding } from "./actions";

const TIMEZONES =
  typeof Intl.supportedValuesOf === "function" ? Intl.supportedValuesOf("timeZone") : [Intl.DateTimeFormat().resolvedOptions().timeZone];

const THEME_OPTIONS: { value: Theme; label: string }[] = [
  { value: "light", label: "☀️ Light" },
  { value: "dark", label: "🌙 Dark" },
  { value: "system", label: "🖥️ System" },
];

const FONT_SIZE_OPTIONS: { value: FontSize; label: string }[] = [
  { value: "sm", label: "A" },
  { value: "md", label: "A" },
  { value: "lg", label: "A" },
];

const LOCALE_OPTIONS: { value: Locale; label: string }[] = [
  { value: "en", label: "🇺🇸 English" },
  { value: "ko", label: "🇰🇷 한국어" },
  { value: "zh", label: "🇨🇳 中文" },
  { value: "ja", label: "🇯🇵 日本語" },
  { value: "es", label: "🇪🇸 Español" },
];

export function OnboardingForm() {
  const router = useRouter();
  const settings = useSettings();
  const { t } = settings;
  const [timezone, setTimezone] = useState(settings.timezone);
  const [childName, setChildName] = useState("");
  const [childType, setChildType] = useState<SubjectType>("child");
  const [birthDate, setBirthDate] = useState("");
  const [dayCountStart, setDayCountStart] = useState<DayCountStart>("zero");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!childName.trim()) {
      setError(childType === "pet" ? t("Your pet's name is required.") : t("Your child's name is required."));
      return;
    }
    if (!birthDate) {
      setError(t("Pick a date first."));
      return;
    }
    setError(null);
    startTransition(async () => {
      try {
        await completeOnboarding({ timezone, childName: childName.trim(), childType, birthDate, dayCountStart });
        router.push("/");
      } catch {
        setError(t("Couldn't save — try again."));
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      <section className="flex flex-col gap-3 rounded-3xl border border-brand-200/70 bg-white p-4 dark:border-brand-800/50 dark:bg-zinc-900">
        <h2 className="font-heading text-sm font-semibold text-brand-800 dark:text-brand-200">
          {t("Your kid or pet")}
        </h2>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setChildType("child")}
            className={`flex-1 rounded-2xl border px-3 py-2 text-sm font-semibold transition-transform hover:scale-105 active:scale-95 ${
              childType === "child"
                ? "border-brand-600 bg-brand-600 text-white"
                : "border-brand-100 text-brand-800 dark:border-brand-900/40 dark:text-brand-200"
            }`}
          >
            {t("👶 Child")}
          </button>
          <button
            type="button"
            onClick={() => setChildType("pet")}
            className={`flex-1 rounded-2xl border px-3 py-2 text-sm font-semibold transition-transform hover:scale-105 active:scale-95 ${
              childType === "pet"
                ? "border-brand-600 bg-brand-600 text-white"
                : "border-brand-100 text-brand-800 dark:border-brand-900/40 dark:text-brand-200"
            }`}
          >
            {t("🐾 Pet")}
          </button>
        </div>

        <label className="flex flex-col gap-1 text-sm">
          {t("Name")}
          <input
            type="text"
            value={childName}
            onChange={(e) => setChildName(e.target.value)}
            placeholder={t("Their name")}
            className="rounded-2xl border border-brand-100 bg-white px-3 py-2 text-sm dark:border-brand-900/40 dark:bg-zinc-900"
          />
        </label>

        <label className="flex flex-col gap-1 text-sm">
          {childType === "pet" ? t("Birthday / adoption day") : t("Birth date")}
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

        <label className="flex flex-col gap-1 text-sm">
          {t("Timezone")}
          <select
            value={timezone}
            onChange={(e) => setTimezone(e.target.value)}
            className="rounded-2xl border border-brand-100 bg-white px-3 py-2 text-sm dark:border-brand-900/40 dark:bg-zinc-900"
          >
            {TIMEZONES.map((tz) => (
              <option key={tz} value={tz}>
                {tz}
              </option>
            ))}
          </select>
        </label>
      </section>

      <section className="flex flex-col gap-3 rounded-3xl border border-brand-200/70 bg-white p-4 dark:border-brand-800/50 dark:bg-zinc-900">
        <h2 className="font-heading text-sm font-semibold text-brand-800 dark:text-brand-200">
          {t("Appearance")}
        </h2>

        <div className="flex flex-col gap-1 text-sm">
          {t("Theme")}
          <div className="flex gap-2">
            {THEME_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => settings.setTheme(opt.value)}
                className={`flex-1 rounded-2xl border px-3 py-2 text-sm font-semibold transition-transform hover:scale-105 active:scale-95 ${
                  settings.theme === opt.value
                    ? "border-brand-600 bg-brand-600 text-white"
                    : "border-brand-100 text-brand-800 dark:border-brand-900/40 dark:text-brand-200"
                }`}
              >
                {t(opt.label)}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-1 text-sm">
          {t("Font size")}
          <div className="flex gap-2">
            {FONT_SIZE_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => settings.setFontSize(opt.value)}
                className={`flex-1 rounded-2xl border px-3 py-2 font-semibold transition-transform hover:scale-105 active:scale-95 ${
                  settings.fontSize === opt.value
                    ? "border-brand-600 bg-brand-600 text-white"
                    : "border-brand-100 text-brand-800 dark:border-brand-900/40 dark:text-brand-200"
                } ${opt.value === "sm" ? "text-xs" : opt.value === "lg" ? "text-lg" : "text-sm"}`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-1 text-sm">
          {t("Language")}
          <div className="flex flex-wrap gap-2">
            {LOCALE_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => settings.setLocale(opt.value)}
                className={`rounded-2xl border px-3 py-2 text-sm font-semibold transition-transform hover:scale-105 active:scale-95 ${
                  settings.locale === opt.value
                    ? "border-brand-600 bg-brand-600 text-white"
                    : "border-brand-100 text-brand-800 dark:border-brand-900/40 dark:text-brand-200"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      {error && <p className="text-sm text-rose-600">{error}</p>}

      <button
        type="submit"
        disabled={isPending}
        className="self-start rounded-full bg-brand-600 px-6 py-2 font-heading text-sm font-semibold text-white shadow-sm shadow-brand-900/20 transition-transform hover:scale-105 hover:bg-brand-700 active:scale-95 disabled:opacity-50 disabled:hover:scale-100"
      >
        {isPending ? t("Saving…") : t("Get started")}
      </button>
    </form>
  );
}
