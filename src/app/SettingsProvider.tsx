"use client";

import { createContext, useContext, useEffect, useState } from "react";
import type { DayCountStart } from "@/lib/date";

export type Theme = "light" | "dark" | "system";
export type FontSize = "sm" | "md" | "lg";

type FamilySettings = {
  timezone: string;
  birthDate: string;
  dayCountStart: DayCountStart;
};

type SettingsContextValue = FamilySettings & {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  fontSize: FontSize;
  setFontSize: (fontSize: FontSize) => void;
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

export function SettingsProvider({ family, children }: { family: FamilySettings; children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(readStoredTheme);
  const [fontSize, setFontSizeState] = useState<FontSize>(readStoredFontSize);

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

  function setTheme(next: Theme) {
    setThemeState(next);
    localStorage.setItem("theme", next);
  }

  function setFontSize(next: FontSize) {
    setFontSizeState(next);
    localStorage.setItem("fontSize", next);
  }

  return (
    <SettingsContext.Provider value={{ ...family, theme, setTheme, fontSize, setFontSize }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error("useSettings must be used within SettingsProvider");
  return ctx;
}
