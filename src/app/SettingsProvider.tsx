"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { translate, type Locale } from "@/lib/i18n";
import { updateLocale } from "./settings/actions";

export type Theme = "light" | "dark" | "system";
export type FontSize = "sm" | "md" | "lg";
export type ColorTheme = "green" | "ocean" | "rose" | "lavender" | "sunset";
export type Background = "cream" | "paper" | "mist";
export type { Locale };

type FamilySettings = {
  timezone: string;
};

export type UserRole = "owner" | "editor" | "viewer";

type SettingsContextValue = FamilySettings & {
  userId: number;
  role: UserRole;
  canEdit: boolean;
  theme: Theme;
  setTheme: (theme: Theme) => void;
  colorTheme: ColorTheme;
  setColorTheme: (colorTheme: ColorTheme) => void;
  background: Background;
  setBackground: (background: Background) => void;
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

const COLOR_THEMES: ColorTheme[] = ["green", "ocean", "rose", "lavender", "sunset"];

function readStoredColorTheme(): ColorTheme {
  if (typeof window === "undefined") return "green";
  const stored = localStorage.getItem("colorTheme");
  return (COLOR_THEMES as string[]).includes(stored ?? "") ? (stored as ColorTheme) : "green";
}

const BACKGROUNDS: Background[] = ["cream", "paper", "mist"];

function readStoredBackground(): Background {
  if (typeof window === "undefined") return "cream";
  const stored = localStorage.getItem("background");
  return (BACKGROUNDS as string[]).includes(stored ?? "") ? (stored as Background) : "cream";
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
  role,
  initialLocale,
  children,
}: {
  family: FamilySettings;
  userId: number;
  role: UserRole;
  // Only set for a logged-in visitor — the DB is the source of truth for their language once
  // they have an account, so it takes priority over whatever's cached in localStorage (e.g. from
  // a different account that previously signed in on this browser). Undefined for logged-out
  // visitors, who keep using the localStorage-only behavior below.
  initialLocale?: Locale;
  children: React.ReactNode;
}) {
  const [theme, setThemeState] = useState<Theme>(readStoredTheme);
  const [colorTheme, setColorThemeState] = useState<ColorTheme>(readStoredColorTheme);
  const [background, setBackgroundState] = useState<Background>(readStoredBackground);
  const [fontSize, setFontSizeState] = useState<FontSize>(readStoredFontSize);
  const [locale, setLocaleState] = useState<Locale>(() => initialLocale ?? readStoredLocale());

  useEffect(() => {
    if (initialLocale) localStorage.setItem("locale", initialLocale);
    // Only meant to sync the DB's value into localStorage once, on mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    applyTheme(theme);
    if (theme !== "system") return;
    const mql = matchMedia("(prefers-color-scheme: dark)");
    const handleChange = () => applyTheme("system");
    mql.addEventListener("change", handleChange);
    return () => mql.removeEventListener("change", handleChange);
  }, [theme]);

  useEffect(() => {
    document.documentElement.dataset.colorTheme = colorTheme;
  }, [colorTheme]);

  useEffect(() => {
    document.documentElement.dataset.bg = background;
  }, [background]);

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

  function setColorTheme(next: ColorTheme) {
    setColorThemeState(next);
    localStorage.setItem("colorTheme", next);
  }

  function setBackground(next: Background) {
    setBackgroundState(next);
    localStorage.setItem("background", next);
  }

  function setFontSize(next: FontSize) {
    setFontSizeState(next);
    localStorage.setItem("fontSize", next);
  }

  function setLocale(next: Locale) {
    setLocaleState(next);
    localStorage.setItem("locale", next);
    if (userId) updateLocale(next).catch(() => {}); // Best-effort — worst case it re-syncs next time they change it.
  }

  function t(text: string) {
    return translate(locale, text);
  }

  return (
    <SettingsContext.Provider
      value={{
        ...family,
        userId,
        role,
        canEdit: role !== "viewer",
        theme,
        setTheme,
        colorTheme,
        setColorTheme,
        background,
        setBackground,
        fontSize,
        setFontSize,
        locale,
        setLocale,
        t,
      }}
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
