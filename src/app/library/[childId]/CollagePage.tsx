import Image from "next/image";
import type { CSSProperties } from "react";
import { getCollageTemplate } from "@/lib/collage";

type Photo = { id: number; url: string; caption: string | null };

export function CollagePage({ photos }: { photos: Photo[] }) {
  const template = getCollageTemplate(photos.length);

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
      {photos.slice(0, template.areas.length).map((photo, i) => (
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
        </div>
      ))}
    </div>
  );
}
