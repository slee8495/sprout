"use client";

import Link from "next/link";
import { useMemo, useState, type CSSProperties } from "react";
import type { Child, JournalEntryWithPhotos } from "@/db/queries";
import { buildAlbumPages, sortAlbumEntries, type AlbumPageData } from "@/lib/albumPages";
import { coverBackgroundHex } from "@/lib/covers";
import { albumSerif } from "@/lib/fonts";
import { subjectEmoji } from "@/lib/milestones";
import { CoverArt } from "../../CoverArt";
import { useSettings } from "../../SettingsProvider";
import { CollagePage } from "./CollagePage";
import { MonthDividerPage } from "./MonthDividerPage";
import { PageCaption } from "./PageCaption";

type PageData = AlbumPageData;

type ViewMode = "scroll" | "pageTurn";
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
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [pdfStatus, setPdfStatus] = useState<PdfStatus>("idle");

  // From/To is the only date-navigation UI now — it drives both what's shown on screen (oldest
  // first, continuous scroll or page-turn) and, unchanged, the exact range exported to PDF.
  const filteredEntries = useMemo(
    () => entries.filter((e) => (!from || e.entryDate >= from) && (!to || e.entryDate <= to)),
    [entries, from, to],
  );
  const sortedEntries = useMemo(() => sortAlbumEntries(filteredEntries), [filteredEntries]);
  const pages = useMemo(() => buildAlbumPages(sortedEntries), [sortedEntries]);

  const coverAnimal = child.coverAnimal || subjectEmoji(child.type);

  async function downloadPdf() {
    setPdfStatus("loading");
    try {
      const params = new URLSearchParams();
      if (from) params.set("from", from);
      if (to) params.set("to", to);
      const qs = params.toString();
      const res = await fetch(`/api/library/${child.id}/export${qs ? `?${qs}` : ""}`);
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
          className="relative flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[var(--cover-light)] text-xl dark:bg-[var(--cover-dark)]"
          style={
            {
              "--cover-light": coverBackgroundHex(child.coverBackground, false),
              "--cover-dark": coverBackgroundHex(child.coverBackground, true),
            } as CSSProperties
          }
        >
          <CoverArt animal={child.coverAnimal} fallbackEmoji={coverAnimal} sizes="40px" />
        </span>
        <div className="flex flex-col">
          <h1 className="font-heading text-2xl font-bold text-brand-700 dark:text-brand-300">{child.name}</h1>
          <p className="text-[10px] text-zinc-400 dark:text-zinc-500">
            {t("🎨 Some illustrations in this album are AI-generated.")}
          </p>
        </div>
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

      <div className="flex flex-wrap items-center gap-2 text-xs">
        <label className="flex items-center gap-1.5 rounded-2xl border border-brand-100 px-2 py-1.5 text-brand-800 dark:border-brand-900/40 dark:text-brand-200">
          {t("From")}
          <input
            type="date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            className="bg-transparent"
          />
        </label>
        <label className="flex items-center gap-1.5 rounded-2xl border border-brand-100 px-2 py-1.5 text-brand-800 dark:border-brand-900/40 dark:text-brand-200">
          {t("To")}
          <input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="bg-transparent" />
        </label>
        {(from || to) && (
          <button
            type="button"
            onClick={() => {
              setFrom("");
              setTo("");
            }}
            className="text-brand-700/70 hover:text-brand-900 dark:text-brand-300/70 dark:hover:text-brand-200"
          >
            {t("Clear")}
          </button>
        )}
        <button
          type="button"
          onClick={downloadPdf}
          disabled={pdfStatus === "loading"}
          className="ml-auto flex items-center gap-1.5 whitespace-nowrap rounded-2xl border border-brand-100 px-3 py-1.5 font-semibold text-brand-800 transition-transform hover:scale-105 active:scale-95 disabled:hover:scale-100 dark:border-brand-900/40 dark:text-brand-200"
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
      {pdfStatus === "error" && <p className="text-xs text-rose-600">{t("Couldn't create the PDF — try again.")}</p>}

      {pages.length === 0 ? (
        <p className="rounded-3xl border border-dashed border-brand-200 p-8 text-center text-sm text-zinc-500 dark:border-brand-900/40 dark:text-zinc-400">
          {t("No photos yet")}
        </p>
      ) : viewMode === "scroll" ? (
        <div className="flex flex-col gap-8">
          {pages.map((page, i) => (
            <AlbumPageFrame key={i} page={page} coverBackground={child.coverBackground} />
          ))}
        </div>
      ) : (
        <div className="flex snap-x snap-mandatory gap-4 overflow-x-auto pb-4">
          {pages.map((page, i) => (
            <div key={i} className="w-full shrink-0 snap-start">
              <AlbumPageFrame page={page} coverBackground={child.coverBackground} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function AlbumPageFrame({ page, coverBackground }: { page: PageData; coverBackground: string | null }) {
  return (
    <div className="aspect-[4/3] overflow-hidden rounded-2xl border border-brand-100/60 bg-[#fffaf0] p-3 shadow-md shadow-brand-900/5 dark:border-brand-900/40 dark:bg-zinc-900 dark:shadow-black/40">
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
