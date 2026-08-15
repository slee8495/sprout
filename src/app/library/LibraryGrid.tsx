"use client";

import Link from "next/link";
import type { CSSProperties } from "react";
import type { Child, JournalEntryWithPhotos } from "@/db/queries";
import { coverBackgroundHex } from "@/lib/covers";
import { fill } from "@/lib/i18n";
import { subjectEmoji } from "@/lib/milestones";
import { CoverArt } from "../CoverArt";
import { useSettings } from "../SettingsProvider";

export function LibraryGrid({ kids, photoEntries }: { kids: Child[]; photoEntries: JournalEntryWithPhotos[] }) {
  const { t } = useSettings();

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
      {kids.map((kid) => {
        const kidEntries = photoEntries.filter((entry) => entry.children.some((c) => c.id === kid.id));
        const photoCount = kidEntries.reduce((sum, entry) => sum + entry.photos.length, 0);
        const dates = kidEntries.map((e) => e.entryDate).sort();
        const range =
          dates.length > 0
            ? formatRange(dates[0], dates[dates.length - 1])
            : t("No photos yet");

        return (
          <Link
            key={kid.id}
            href={`/library/${kid.id}`}
            className="flex flex-col gap-2 rounded-3xl border border-brand-100/60 bg-white p-3 shadow-md shadow-brand-900/5 transition-transform hover:scale-[1.03] active:scale-95 dark:border-brand-900/40 dark:bg-zinc-900 dark:shadow-black/40"
          >
            <div
              className="relative flex aspect-[3/4] w-full items-center justify-center overflow-hidden rounded-2xl bg-[var(--cover-light)] text-5xl shadow-inner dark:bg-[var(--cover-dark)]"
              style={
                {
                  "--cover-light": coverBackgroundHex(kid.coverBackground, false),
                  "--cover-dark": coverBackgroundHex(kid.coverBackground, true),
                } as CSSProperties
              }
            >
              <CoverArt animal={kid.coverAnimal} fallbackEmoji={subjectEmoji(kid.type)} sizes="220px" />
            </div>
            <div>
              <h2 className="font-heading text-sm font-bold text-brand-900 dark:text-brand-100">{kid.name}</h2>
              <p className="text-xs text-zinc-600 dark:text-zinc-400">
                {photoCount > 0 ? fill(t("{count} photos"), { count: photoCount }) : t("No photos yet")}
              </p>
              {dates.length > 0 && <p className="text-xs text-zinc-500 dark:text-zinc-500">{range}</p>}
            </div>
          </Link>
        );
      })}
    </div>
  );
}

function formatRange(start: string, end: string) {
  const fmt = (d: string) => new Date(`${d}T00:00:00`).toLocaleDateString(undefined, { year: "numeric", month: "short" });
  const startLabel = fmt(start);
  const endLabel = fmt(end);
  return startLabel === endLabel ? startLabel : `${startLabel} – ${endLabel}`;
}
