"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";
import type { JournalEntryWithPhotos } from "@/db/queries";

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
        aria-label="Close"
        className="absolute right-4 top-4 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-xl font-bold text-white hover:bg-white/20"
      >
        ×
      </button>
      {photos.length > 1 && (
        <div className="absolute right-4 top-4 mr-14 flex h-9 items-center rounded-full bg-white/10 px-3 text-xs font-semibold text-white">
          {photos.length} photos — swipe to browse
        </div>
      )}
      <div
        ref={containerRef}
        onClick={(e) => e.stopPropagation()}
        className="flex h-full w-full snap-x snap-mandatory overflow-x-auto"
      >
        {photos.map((photo) => (
          <div key={photo.id} className="flex h-full w-full flex-shrink-0 snap-center items-center justify-center px-4">
            <Image
              src={photo.url}
              alt={photo.caption ?? ""}
              width={1200}
              height={1200}
              className="max-h-full max-w-full rounded-lg object-contain"
            />
          </div>
        ))}
      </div>
    </div>
  );
}
