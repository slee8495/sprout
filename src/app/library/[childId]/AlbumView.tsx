"use client";

import Link from "next/link";
import { useMemo, useRef, useState, type CSSProperties } from "react";
import type { Child, JournalEntryWithPhotos } from "@/db/queries";
import { Calendar } from "../../Calendar";
import { MAX_COLLAGE_PHOTOS } from "@/lib/collage";
import { coverBackgroundHex } from "@/lib/covers";
import { albumSerif } from "@/lib/fonts";
import { subjectEmoji } from "@/lib/milestones";
import { useSettings } from "../../SettingsProvider";
import { CollagePage } from "./CollagePage";
import { MilestoneTitlePage } from "./MilestoneTitlePage";

type Photo = { id: number; url: string; caption: string | null };
type PageData =
  | { kind: "title"; date: string; label: string; photos: Photo[] }
  | { kind: "collage"; date: string; photos: Photo[] };

function buildPages(entries: JournalEntryWithPhotos[]): PageData[] {
  const byDate = new Map<string, JournalEntryWithPhotos[]>();
  const order: string[] = [];
  for (const entry of entries) {
    if (!byDate.has(entry.entryDate)) {
      byDate.set(entry.entryDate, []);
      order.push(entry.entryDate);
    }
    byDate.get(entry.entryDate)!.push(entry);
  }

  const pages: PageData[] = [];
  for (const date of order) {
    const dayEntries = byDate.get(date)!;
    const milestoneEntry = dayEntries.find((e) => e.milestoneLabel);
    let pool: Photo[] = dayEntries.flatMap((e) => e.photos);

    if (milestoneEntry) {
      const accents = milestoneEntry.photos.slice(0, 4);
      const accentIds = new Set(accents.map((p) => p.id));
      pool = pool.filter((p) => !accentIds.has(p.id));
      pages.push({ kind: "title", date, label: milestoneEntry.milestoneLabel!, photos: accents });
    }

    for (let i = 0; i < pool.length; i += MAX_COLLAGE_PHOTOS) {
      pages.push({ kind: "collage", date, photos: pool.slice(i, i + MAX_COLLAGE_PHOTOS) });
    }
  }
  return pages;
}

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

  const sortedEntries = useMemo(() => {
    const sorted = [...entries].sort((a, b) => (a.entryDate < b.entryDate ? -1 : a.entryDate > b.entryDate ? 1 : 0));
    if (sortOrder === "latest") sorted.reverse();
    return sorted;
  }, [entries, sortOrder]);

  const pages = useMemo(() => buildPages(sortedEntries), [sortedEntries]);
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
      </div>

      <Calendar entryDates={entryDates} selectedDate={selectedDate} onSelectDate={jumpToDate} />

      {pages.length === 0 ? (
        <p className="rounded-3xl border border-dashed border-brand-200 p-8 text-center text-sm text-zinc-500 dark:border-brand-900/40 dark:text-zinc-400">
          {t("No photos yet")}
        </p>
      ) : viewMode === "scroll" ? (
        <div className="flex flex-col gap-8">
          {pages.map((page, i) => (
            <AlbumPageFrame key={i} page={page} orientation={orientation} coverAnimal={coverAnimal} registerRef={pageRefs} />
          ))}
        </div>
      ) : (
        <div className="flex snap-x snap-mandatory gap-4 overflow-x-auto pb-4">
          {pages.map((page, i) => (
            <div key={i} className="w-full shrink-0 snap-start">
              <AlbumPageFrame page={page} orientation={orientation} coverAnimal={coverAnimal} registerRef={pageRefs} />
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
}: {
  page: PageData;
  orientation: Orientation;
  coverAnimal: string;
  registerRef: React.RefObject<Map<string, HTMLDivElement>>;
}) {
  return (
    <div
      ref={(el) => {
        if (el && !registerRef.current.has(page.date)) registerRef.current.set(page.date, el);
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
