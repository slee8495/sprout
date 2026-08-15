"use client";

import Link from "next/link";
import { useMemo, useRef, useState, type CSSProperties } from "react";
import type { Child, JournalEntryWithPhotos } from "@/db/queries";
import { Calendar } from "../../Calendar";
import { buildAlbumPages, sortAlbumEntries, type AlbumPageData } from "@/lib/albumPages";
import { coverBackgroundHex } from "@/lib/covers";
import { albumSerif } from "@/lib/fonts";
import { subjectEmoji } from "@/lib/milestones";
import { useSettings } from "../../SettingsProvider";
import { CollagePage } from "./CollagePage";
import { MilestoneTitlePage } from "./MilestoneTitlePage";

type PageData = AlbumPageData;

type SortOrder = "oldest" | "latest";
type ViewMode = "scroll" | "pageTurn";
type Orientation = "portrait" | "landscape";

export function AlbumView({
  child,
  kids,
  entries,
}: {
  child: Child;
  kids: Child[];
  entries: JournalEntryWithPhotos[];
}) {
  const { t } = useSettings();
  const [sortOrder, setSortOrder] = useState<SortOrder>("oldest");
  const [viewMode, setViewMode] = useState<ViewMode>("scroll");
  const [orientation, setOrientation] = useState<Orientation>("portrait");
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const pageRefs = useRef(new Map<string, HTMLDivElement>());

  const sortedEntries = useMemo(() => sortAlbumEntries(entries, sortOrder), [entries, sortOrder]);

  const pages = useMemo(() => buildAlbumPages(sortedEntries), [sortedEntries]);
  // Which pages are the first (of possibly several) for their date, computed fresh per `pages`
  // identity rather than tracked via a "seen it once" flag on the ref map itself — the latter
  // goes stale across a scroll/page-turn remount, since unmounted refs report `null` and never
  // clear their old (now-detached) map entry, permanently blocking re-registration.
  const isFirstForDate = useMemo(() => {
    const seen = new Set<string>();
    return pages.map((page) => {
      const first = !seen.has(page.date);
      seen.add(page.date);
      return first;
    });
  }, [pages]);
  const entryDates = useMemo(() => new Set(entries.map((e) => e.entryDate)), [entries]);
  const coverAnimal = child.coverAnimal || subjectEmoji(child.type);

  function jumpToDate(date: string | null) {
    setSelectedDate(date);
    if (!date) return;
    const el = pageRefs.current.get(date);
    el?.scrollIntoView({ behavior: "smooth", block: viewMode === "scroll" ? "start" : "nearest", inline: "start" });
  }

  return (
    <div className={`${albumSerif.variable} mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 p-4 pb-24`}>
      <header className="flex items-center gap-3 pt-4">
        <Link
          href="/library"
          aria-label={t("Back to Albums")}
          className="rounded-full p-1.5 text-brand-700 transition-transform hover:scale-110 hover:bg-brand-50 dark:text-brand-300 dark:hover:bg-brand-900/30"
        >
          ‹
        </Link>
        <span
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--cover-light)] text-xl dark:bg-[var(--cover-dark)]"
          style={
            {
              "--cover-light": coverBackgroundHex(child.coverBackground, false),
              "--cover-dark": coverBackgroundHex(child.coverBackground, true),
            } as CSSProperties
          }
        >
          {coverAnimal}
        </span>
        <h1 className="font-heading text-2xl font-bold text-brand-700 dark:text-brand-300">{child.name}</h1>
      </header>

      {kids.length > 1 && (
        <div className="flex flex-wrap gap-2">
          {kids.map((k) => (
            <Link
              key={k.id}
              href={`/library/${k.id}`}
              className={`rounded-full px-3 py-1.5 font-heading text-sm font-semibold transition-transform hover:scale-105 active:scale-95 ${
                k.id === child.id
                  ? "bg-brand-600 text-white shadow-sm shadow-brand-900/20"
                  : "border border-brand-100 text-brand-800 dark:border-brand-900/40 dark:text-brand-200"
              }`}
            >
              {k.name}
            </Link>
          ))}
        </div>
      )}

      <div className="flex flex-wrap gap-2 text-xs">
        <select
          value={sortOrder}
          onChange={(e) => setSortOrder(e.target.value as SortOrder)}
          className="rounded-2xl border border-brand-100 bg-white px-3 py-1.5 dark:border-brand-900/40 dark:bg-zinc-900"
        >
          <option value="oldest">{t("Oldest first")}</option>
          <option value="latest">{t("Latest first")}</option>
        </select>
        <div className="flex overflow-hidden rounded-2xl border border-brand-100 dark:border-brand-900/40">
          <button
            type="button"
            onClick={() => setViewMode("scroll")}
            className={`px-3 py-1.5 font-semibold ${viewMode === "scroll" ? "bg-brand-600 text-white" : "text-brand-800 dark:text-brand-200"}`}
          >
            {t("📜 Scroll")}
          </button>
          <button
            type="button"
            onClick={() => setViewMode("pageTurn")}
            className={`px-3 py-1.5 font-semibold ${viewMode === "pageTurn" ? "bg-brand-600 text-white" : "text-brand-800 dark:text-brand-200"}`}
          >
            {t("📖 Page turn")}
          </button>
        </div>
        <div className="flex overflow-hidden rounded-2xl border border-brand-100 dark:border-brand-900/40">
          <button
            type="button"
            onClick={() => setOrientation("portrait")}
            className={`px-3 py-1.5 font-semibold ${orientation === "portrait" ? "bg-brand-600 text-white" : "text-brand-800 dark:text-brand-200"}`}
          >
            {t("Portrait")}
          </button>
          <button
            type="button"
            onClick={() => setOrientation("landscape")}
            className={`px-3 py-1.5 font-semibold ${orientation === "landscape" ? "bg-brand-600 text-white" : "text-brand-800 dark:text-brand-200"}`}
          >
            {t("Landscape")}
          </button>
        </div>
        {pages.length > 0 && (
          <a
            href={`/api/library/${child.id}/export?orientation=${orientation}&sort=${sortOrder}`}
            className="rounded-2xl border border-brand-100 px-3 py-1.5 font-semibold text-brand-800 transition-transform hover:scale-105 active:scale-95 dark:border-brand-900/40 dark:text-brand-200"
          >
            {t("⬇️ Download PDF")}
          </a>
        )}
      </div>

      <Calendar entryDates={entryDates} selectedDate={selectedDate} onSelectDate={jumpToDate} />

      {pages.length === 0 ? (
        <p className="rounded-3xl border border-dashed border-brand-200 p-8 text-center text-sm text-zinc-500 dark:border-brand-900/40 dark:text-zinc-400">
          {t("No photos yet")}
        </p>
      ) : viewMode === "scroll" ? (
        <div className="flex flex-col gap-8">
          {pages.map((page, i) => (
            <AlbumPageFrame
              key={i}
              page={page}
              orientation={orientation}
              coverAnimal={coverAnimal}
              registerRef={pageRefs}
              isFirstForDate={isFirstForDate[i]}
            />
          ))}
        </div>
      ) : (
        <div className="flex snap-x snap-mandatory gap-4 overflow-x-auto pb-4">
          {pages.map((page, i) => (
            <div key={i} className="w-full shrink-0 snap-start">
              <AlbumPageFrame
                page={page}
                orientation={orientation}
                coverAnimal={coverAnimal}
                registerRef={pageRefs}
                isFirstForDate={isFirstForDate[i]}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function AlbumPageFrame({
  page,
  orientation,
  coverAnimal,
  registerRef,
  isFirstForDate,
}: {
  page: PageData;
  orientation: Orientation;
  coverAnimal: string;
  registerRef: React.RefObject<Map<string, HTMLDivElement>>;
  isFirstForDate: boolean;
}) {
  return (
    <div
      ref={(el) => {
        if (el && isFirstForDate) registerRef.current.set(page.date, el);
      }}
      className={`overflow-hidden rounded-2xl border border-brand-100/60 bg-[#fffaf0] p-3 shadow-md shadow-brand-900/5 dark:border-brand-900/40 dark:bg-zinc-900 dark:shadow-black/40 ${
        orientation === "portrait" ? "aspect-[3/4]" : "aspect-[4/3]"
      }`}
    >
      {page.kind === "title" ? (
        <MilestoneTitlePage date={page.date} label={page.label} photos={page.photos} coverAnimal={coverAnimal} />
      ) : (
        <CollagePage photos={page.photos} />
      )}
    </div>
  );
}
