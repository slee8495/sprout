"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useRef, useState, type CSSProperties } from "react";
import type { Child, JournalEntryWithPhotos } from "@/db/queries";
import { Calendar } from "../../Calendar";
import { buildAlbumPages, sortAlbumEntries, type AlbumPageData } from "@/lib/albumPages";
import { coverBackgroundHex } from "@/lib/covers";
import { albumSerif } from "@/lib/fonts";
import { formatEntryDate, subjectEmoji } from "@/lib/milestones";
import { useSettings } from "../../SettingsProvider";
import { CollagePage } from "./CollagePage";
import { MonthDividerPage } from "./MonthDividerPage";
import { PageCaption } from "./PageCaption";

type PageData = AlbumPageData;

type ViewMode = "scroll" | "pageTurn";
type PdfOrientation = "portrait" | "landscape";
type PdfStatus = "idle" | "loading" | "error";

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
  const [viewMode, setViewMode] = useState<ViewMode>("scroll");
  const [pdfOrientation, setPdfOrientation] = useState<PdfOrientation>("portrait");
  const [pdfFrom, setPdfFrom] = useState("");
  const [pdfTo, setPdfTo] = useState("");
  const [pdfStatus, setPdfStatus] = useState<PdfStatus>("idle");
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const pageRefs = useRef(new Map<string, HTMLDivElement>());
  const monthRefs = useRef(new Map<string, HTMLDivElement>());

  const sortedEntries = useMemo(() => sortAlbumEntries(entries), [entries]);

  const pages = useMemo(() => buildAlbumPages(sortedEntries), [sortedEntries]);
  // Which of a page's dates it should claim in the ref map, computed fresh per `pages` identity
  // rather than tracked via a "seen it once" flag on the ref map itself — the latter goes stale
  // across a scroll/page-turn remount, since unmounted refs report `null` and never clear their
  // old (now-detached) map entry, permanently blocking re-registration. A page can span more than
  // one date (light days get merged together), so this claims every date not already taken by an
  // earlier page rather than a single boolean. Month dividers never claim a date — jumping to a
  // date should land on the real content page, not the chapter break in front of it.
  const datesToRegister = useMemo(() => {
    const seen = new Set<string>();
    return pages.map((page) => {
      if (page.kind === "month") return [];
      const claim = page.dates.filter((d) => !seen.has(d));
      claim.forEach((d) => seen.add(d));
      return claim;
    });
  }, [pages]);
  const entryDates = useMemo(() => new Set(entries.map((e) => e.entryDate)), [entries]);
  const selectedDatePhotos = useMemo(
    () => (selectedDate ? entries.filter((e) => e.entryDate === selectedDate).flatMap((e) => e.photos) : []),
    [entries, selectedDate],
  );
  const coverAnimal = child.coverAnimal || subjectEmoji(child.type);

  function jumpToDate(date: string | null) {
    setSelectedDate(date);
    if (!date) return;
    const el = pageRefs.current.get(date);
    el?.scrollIntoView({ behavior: "smooth", block: viewMode === "scroll" ? "start" : "nearest", inline: "start" });
  }

  // Fires when the calendar itself is navigated to a different month (prev/next arrows, or the
  // jump-to-month input) — not when a specific date is picked. Scrolls to that month's chapter
  // page if this album has one; no-ops for months with nothing in them.
  function jumpToMonth(year: number, month0: number) {
    const key = `${year}-${String(month0 + 1).padStart(2, "0")}`;
    const el = monthRefs.current.get(key);
    el?.scrollIntoView({ behavior: "smooth", block: viewMode === "scroll" ? "start" : "nearest", inline: "start" });
  }

  async function downloadPdf() {
    setPdfStatus("loading");
    try {
      const params = new URLSearchParams({ orientation: pdfOrientation });
      if (pdfFrom) params.set("from", pdfFrom);
      if (pdfTo) params.set("to", pdfTo);
      const res = await fetch(`/api/library/${child.id}/export?${params}`);
      if (!res.ok) throw new Error("export failed");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${child.name.replace(/[^a-z0-9]+/gi, "_")}-album.pdf`;
      a.click();
      URL.revokeObjectURL(url);
      setPdfStatus("idle");
    } catch {
      setPdfStatus("error");
    }
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

      <div className="flex flex-wrap items-center gap-2 text-xs">
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
      </div>

      {pages.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <select
            value={pdfOrientation}
            onChange={(e) => setPdfOrientation(e.target.value as PdfOrientation)}
            aria-label={t("PDF page format")}
            disabled={pdfStatus === "loading"}
            className="rounded-2xl border border-brand-100 bg-white px-3 py-1.5 text-brand-800 dark:border-brand-900/40 dark:bg-zinc-900 dark:text-brand-200"
          >
            <option value="portrait">{t("Portrait")}</option>
            <option value="landscape">{t("Landscape")}</option>
          </select>
          <label className="flex items-center gap-1.5 rounded-2xl border border-brand-100 px-2 py-1.5 text-brand-800 dark:border-brand-900/40 dark:text-brand-200">
            {t("From")}
            <input
              type="date"
              value={pdfFrom}
              onChange={(e) => setPdfFrom(e.target.value)}
              disabled={pdfStatus === "loading"}
              className="bg-transparent"
            />
          </label>
          <label className="flex items-center gap-1.5 rounded-2xl border border-brand-100 px-2 py-1.5 text-brand-800 dark:border-brand-900/40 dark:text-brand-200">
            {t("To")}
            <input
              type="date"
              value={pdfTo}
              onChange={(e) => setPdfTo(e.target.value)}
              disabled={pdfStatus === "loading"}
              className="bg-transparent"
            />
          </label>
          <button
            type="button"
            onClick={downloadPdf}
            disabled={pdfStatus === "loading"}
            className="flex items-center gap-1.5 whitespace-nowrap rounded-2xl border border-brand-100 px-3 py-1.5 font-semibold text-brand-800 transition-transform hover:scale-105 active:scale-95 disabled:hover:scale-100 dark:border-brand-900/40 dark:text-brand-200"
          >
            {pdfStatus === "loading" ? (
              <>
                <span className="h-3 w-3 animate-spin rounded-full border-2 border-brand-600 border-t-transparent dark:border-brand-300" />
                {t("Preparing PDF…")}
              </>
            ) : (
              t("⬇️ Download PDF")
            )}
          </button>
        </div>
      )}
      {pdfStatus === "error" && <p className="text-xs text-rose-600">{t("Couldn't create the PDF — try again.")}</p>}

      <Calendar entryDates={entryDates} selectedDate={selectedDate} onSelectDate={jumpToDate} onMonthChange={jumpToMonth} />

      {selectedDate && (
        <div className="flex flex-col gap-2">
          <h3 className="font-heading text-sm font-semibold text-brand-800 dark:text-brand-200">
            {formatEntryDate(selectedDate)}
          </h3>
          {selectedDatePhotos.length > 0 ? (
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
              {selectedDatePhotos.map((photo) => (
                <div key={photo.id} className="relative aspect-square overflow-hidden rounded-xl bg-[#f2ece0] dark:bg-zinc-800">
                  <Image src={photo.url} alt={photo.caption ?? ""} fill sizes="150px" className="object-contain" />
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-zinc-500 dark:text-zinc-400">{t("No photos yet")}</p>
          )}
        </div>
      )}

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
              coverBackground={child.coverBackground}
              registerRef={pageRefs}
              monthRegisterRef={monthRefs}
              datesToRegister={datesToRegister[i]}
            />
          ))}
        </div>
      ) : (
        <div className="flex snap-x snap-mandatory gap-4 overflow-x-auto pb-4">
          {pages.map((page, i) => (
            <div key={i} className="w-full shrink-0 snap-start">
              <AlbumPageFrame
                page={page}
                coverBackground={child.coverBackground}
                registerRef={pageRefs}
                monthRegisterRef={monthRefs}
                datesToRegister={datesToRegister[i]}
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
  coverBackground,
  registerRef,
  monthRegisterRef,
  datesToRegister,
}: {
  page: PageData;
  coverBackground: string | null;
  registerRef: React.RefObject<Map<string, HTMLDivElement>>;
  monthRegisterRef: React.RefObject<Map<string, HTMLDivElement>>;
  datesToRegister: string[];
}) {
  return (
    <div
      ref={(el) => {
        if (!el) return;
        if (page.kind === "month") monthRegisterRef.current.set(page.dates[0].slice(0, 7), el);
        for (const date of datesToRegister) registerRef.current.set(date, el);
      }}
      className="aspect-[3/4] overflow-hidden rounded-2xl border border-brand-100/60 bg-[#fffaf0] p-3 shadow-md shadow-brand-900/5 dark:border-brand-900/40 dark:bg-zinc-900 dark:shadow-black/40"
    >
      {page.kind === "month" ? (
        <MonthDividerPage date={page.dates[0]} coverBackground={coverBackground} />
      ) : (
        <div className="flex h-full w-full flex-col">
          <PageCaption dates={page.dates} label={page.kind === "title" ? page.label : undefined} />
          <div className="min-h-0 flex-1">
            <CollagePage photos={page.photos} />
          </div>
        </div>
      )}
    </div>
  );
}
