"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useSettings, type FontSize, type Locale, type Theme } from "../SettingsProvider";
import { saveFamilySettings } from "./actions";

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

export function FamilySettingsForm() {
  const router = useRouter();
  const settings = useSettings();
  const { t } = settings;
  const [timezone, setTimezone] = useState(settings.timezone);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      try {
        await saveFamilySettings({ timezone });
        setSaved(true);
        router.refresh();
      } catch {
        setError(t("Couldn't save settings — try again."));
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      <section className="flex flex-col gap-3 rounded-3xl border border-emerald-200/70 bg-white p-4 dark:border-emerald-800/50 dark:bg-zinc-900">
        <h2 className="font-heading text-sm font-semibold text-emerald-800 dark:text-emerald-200">{t("Family")}</h2>

        <label className="flex flex-col gap-1 text-sm">
          {t("Timezone")}
          <select
            value={timezone}
            onChange={(e) => setTimezone(e.target.value)}
            className="rounded-2xl border border-emerald-100 bg-white px-3 py-2 text-sm dark:border-emerald-900/40 dark:bg-zinc-900"
          >
            {TIMEZONES.map((tz) => (
              <option key={tz} value={tz}>
                {tz}
              </option>
            ))}
          </select>
        </label>
      </section>

      <section className="flex flex-col gap-3 rounded-3xl border border-emerald-200/70 bg-white p-4 dark:border-emerald-800/50 dark:bg-zinc-900">
        <h2 className="font-heading text-sm font-semibold text-emerald-800 dark:text-emerald-200">
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
                    ? "border-emerald-600 bg-emerald-600 text-white"
                    : "border-emerald-100 text-emerald-800 dark:border-emerald-900/40 dark:text-emerald-200"
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
                    ? "border-emerald-600 bg-emerald-600 text-white"
                    : "border-emerald-100 text-emerald-800 dark:border-emerald-900/40 dark:text-emerald-200"
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
                    ? "border-emerald-600 bg-emerald-600 text-white"
                    : "border-emerald-100 text-emerald-800 dark:border-emerald-900/40 dark:text-emerald-200"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      {error && <p className="text-sm text-rose-600">{error}</p>}
      {saved && !error && <p className="text-sm text-emerald-600">{t("Saved.")}</p>}

      <button
        type="submit"
        disabled={isPending}
        className="self-start rounded-full bg-emerald-600 px-6 py-2 font-heading text-sm font-semibold text-white shadow-sm shadow-emerald-900/20 transition-transform hover:scale-105 hover:bg-emerald-700 active:scale-95 disabled:opacity-50 disabled:hover:scale-100"
      >
        {isPending ? t("Saving…") : t("Save")}
      </button>
    </form>
  );
}
