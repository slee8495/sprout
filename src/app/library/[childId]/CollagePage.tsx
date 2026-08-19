"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState, useTransition, type CSSProperties } from "react";
import { setPhotoAlbumExclusion } from "../../actions";
import { useSettings } from "../../SettingsProvider";
import { getCollageTemplate } from "@/lib/collage";

type Photo = { id: number; url: string; caption: string | null };

export function CollagePage({ photos }: { photos: Photo[] }) {
  const { t } = useSettings();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  // Once removed, a tile fades out locally rather than waiting on the full page's router.refresh()
  // (a moment behind on a slow connection) — avoids the "I tapped it, nothing happened" feeling.
  const [removedIds, setRemovedIds] = useState<Set<number>>(new Set());
  const visiblePhotos = photos.filter((p) => !removedIds.has(p.id));
  const template = getCollageTemplate(visiblePhotos.length);

  function removeFromAlbum(photoId: number) {
    setRemovedIds((prev) => new Set(prev).add(photoId));
    startTransition(async () => {
      try {
        await setPhotoAlbumExclusion(photoId, true);
        router.refresh();
      } catch {
        setRemovedIds((prev) => {
          const copy = new Set(prev);
          copy.delete(photoId);
          return copy;
        });
      }
    });
  }

  return (
    <div
      className="grid h-full w-full gap-2"
      style={
        {
          gridTemplateColumns: template.gridTemplateColumns,
          gridTemplateRows: template.gridTemplateRows,
          gridTemplateAreas: template.gridTemplateAreas,
        } as CSSProperties
      }
    >
      {visiblePhotos.slice(0, template.areas.length).map((photo, i) => (
        <div
          key={photo.id}
          className="relative overflow-hidden rounded-lg bg-[#f2ece0] dark:bg-zinc-800"
          style={{ gridArea: template.areas[i] }}
        >
          {/* object-contain, not cover — a crop-to-fill heuristic (center, top-biased, even
              sharp's "attention" saliency guess) reliably cuts someone's face off often enough
              in real family photos (a baby lower in frame than the adult holding them, etc.)
              that showing the whole photo with a little matting beats risking that. */}
          <Image src={photo.url} alt={photo.caption ?? ""} fill sizes="50vw" className="object-contain" />
          <button
            type="button"
            onClick={() => removeFromAlbum(photo.id)}
            disabled={isPending}
            aria-label={t("Remove from Album")}
            title={t("Remove from Album")}
            className="absolute right-1.5 top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-black/50 text-xs font-bold text-white hover:bg-black/70 disabled:opacity-50"
          >
            ×
          </button>
        </div>
      ))}
    </div>
  );
}
