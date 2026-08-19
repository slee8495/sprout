"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import Image from "next/image";
import type { JournalEntryWithPhotos } from "@/db/queries";
import { setPhotoAlbumExclusion } from "./actions";
import { fill } from "@/lib/i18n";
import { DownloadButton } from "./DownloadButton";
import { useSettings } from "./SettingsProvider";

type Photo = JournalEntryWithPhotos["photos"][number];

export function PhotoLightbox({
  photos,
  initialIndex,
  onClose,
}: {
  photos: Photo[];
  initialIndex: number;
  onClose: () => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { t } = useSettings();
  const [excluded, setExcluded] = useState(() => new Set(photos.filter((p) => p.excludeFromAlbum).map((p) => p.id)));
  const [isPending, startTransition] = useTransition();

  function toggleAlbumExclusion(photoId: number) {
    const next = !excluded.has(photoId);
    setExcluded((prev) => {
      const copy = new Set(prev);
      if (next) copy.add(photoId);
      else copy.delete(photoId);
      return copy;
    });
    startTransition(async () => {
      try {
        await setPhotoAlbumExclusion(photoId, next);
      } catch {
        // Revert on failure — the server is the source of truth for the next load either way.
        setExcluded((prev) => {
          const copy = new Set(prev);
          if (next) copy.delete(photoId);
          else copy.add(photoId);
          return copy;
        });
      }
    });
  }

  useEffect(() => {
    const slide = containerRef.current?.children[initialIndex];
    slide?.scrollIntoView({ behavior: "instant", inline: "start" });
  }, [initialIndex]);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKeyDown);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center bg-black/90" onClick={onClose}>
      <button
        type="button"
        onClick={onClose}
        aria-label={t("Close")}
        style={{ top: "calc(env(safe-area-inset-top) + 1rem)" }}
        className="absolute right-4 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-xl font-bold text-white hover:bg-white/20"
      >
        ×
      </button>
      {photos.length > 1 && (
        <div
          style={{ top: "calc(env(safe-area-inset-top) + 1rem)" }}
          className="absolute right-4 mr-14 flex h-9 items-center rounded-full bg-white/10 px-3 text-xs font-semibold text-white"
        >
          {fill(t("{count} photos — swipe to browse"), { count: photos.length })}
        </div>
      )}
      <div
        ref={containerRef}
        onClick={(e) => e.stopPropagation()}
        className="flex h-full w-full snap-x snap-mandatory overflow-x-auto"
      >
        {photos.map((photo) => (
          <div
            key={photo.id}
            className="relative flex h-full w-full flex-shrink-0 snap-center items-center justify-center px-4"
          >
            <Image
              src={photo.url}
              alt={photo.caption ?? ""}
              width={1200}
              height={1200}
              className="max-h-full max-w-full rounded-lg object-contain"
            />
            <DownloadButton
              url={photo.url}
              kind="photo"
              className="absolute bottom-4 right-4 flex h-9 items-center gap-1.5 rounded-full bg-white/10 px-3 text-xs font-semibold text-white hover:bg-white/20"
            >
              ⬇ {t("Download")}
            </DownloadButton>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                toggleAlbumExclusion(photo.id);
              }}
              disabled={isPending}
              aria-pressed={!excluded.has(photo.id)}
              className={`absolute bottom-4 left-4 flex h-9 items-center gap-1.5 rounded-full px-3 text-xs font-semibold text-white disabled:opacity-60 ${
                excluded.has(photo.id) ? "bg-white/10 hover:bg-white/20" : "bg-brand-600 hover:bg-brand-700"
              }`}
            >
              {excluded.has(photo.id) ? `🚫 ${t("Not in Album")}` : `📕 ${t("In Album")}`}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
