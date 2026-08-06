"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { translate, type Locale } from "@/lib/i18n";

export type Theme = "light" | "dark" | "system";
export type FontSize = "sm" | "md" | "lg";
export type { Locale };

type FamilySettings = {
  timezone: string;
};

type SettingsContextValue = FamilySettings & {
  userId: number;
  theme: Theme;
  setTheme: (theme: Theme) => void;
  fontSize: FontSize;
  setFontSize: (fontSize: FontSize) => void;
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (text: string) => string;
};

const SettingsContext = createContext<SettingsContextValue | null>(null);

function applyTheme(theme: Theme) {
  const isDark = theme === "dark" || (theme === "system" && matchMedia("(prefers-color-scheme: dark)").matches);
  document.documentElement.classList.toggle("dark", isDark);
}

function readStoredTheme(): Theme {
  if (typeof window === "undefined") return "system";
  const stored = localStorage.getItem("theme");
  return stored === "light" || stored === "dark" || stored === "system" ? stored : "system";
}

function readStoredFontSize(): FontSize {
  if (typeof window === "undefined") return "md";
  const stored = localStorage.getItem("fontSize");
  return stored === "sm" || stored === "md" || stored === "lg" ? stored : "md";
}

const LOCALES: Locale[] = ["en", "ko", "zh", "ja", "es"];

function readStoredLocale(): Locale {
  if (typeof window === "undefined") return "en";
  const stored = localStorage.getItem("locale");
  return (LOCALES as string[]).includes(stored ?? "") ? (stored as Locale) : "en";
}

export function SettingsProvider({
  family,
  userId,
  children,
}: {
  family: FamilySettings;
  userId: number;
  children: React.ReactNode;
}) {
  const [theme, setThemeState] = useState<Theme>(readStoredTheme);
  const [fontSize, setFontSizeState] = useState<FontSize>(readStoredFontSize);
  const [locale, setLocaleState] = useState<Locale>(readStoredLocale);

  useEffect(() => {
    applyTheme(theme);
    if (theme !== "system") return;
    const mql = matchMedia("(prefers-color-scheme: dark)");
    const handleChange = () => applyTheme("system");
    mql.addEventListener("change", handleChange);
    return () => mql.removeEventListener("change", handleChange);
  }, [theme]);

  useEffect(() => {
    document.documentElement.dataset.fontSize = fontSize;
  }, [fontSize]);

  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  function setTheme(next: Theme) {
    setThemeState(next);
    localStorage.setItem("theme", next);
  }

  function setFontSize(next: FontSize) {
    setFontSizeState(next);
    localStorage.setItem("fontSize", next);
  }

  function setLocale(next: Locale) {
    setLocaleState(next);
    localStorage.setItem("locale", next);
  }

  function t(text: string) {
    return translate(locale, text);
  }

  return (
    <SettingsContext.Provider
      value={{ ...family, userId, theme, setTheme, fontSize, setFontSize, locale, setLocale, t }}
    >
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error("useSettings must be used within SettingsProvider");
  return ctx;
}
