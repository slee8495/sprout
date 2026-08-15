import Image from "next/image";
import type { CSSProperties } from "react";
import { coverBackgroundHex } from "@/lib/covers";
import { formatEntryDate } from "@/lib/milestones";

type Photo = { id: number; url: string; caption: string | null };

export function MilestoneTitlePage({
  date,
  label,
  photos,
  coverBackground,
}: {
  date: string;
  label: string;
  photos: Photo[];
  coverBackground: string | null;
}) {
  return (
    <div
      className="flex h-full w-full flex-col items-center justify-center gap-6 bg-[var(--cover-light)] px-6 text-center dark:bg-[var(--cover-dark)]"
      style={
        {
          "--cover-light": coverBackgroundHex(coverBackground, false),
          "--cover-dark": coverBackgroundHex(coverBackground, true),
        } as CSSProperties
      }
    >
      <div className="flex flex-col items-center gap-2">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-600 dark:text-zinc-300">
          {formatEntryDate(date)}
        </p>
        <span className="h-px w-10 bg-zinc-800/25 dark:bg-zinc-100/25" />
        <h2 className="font-[family-name:var(--font-album-serif)] text-4xl font-semibold text-zinc-800 sm:text-5xl dark:text-zinc-100">
          {label}
        </h2>
      </div>
      {photos.length > 0 && (
        <div className="flex gap-3">
          {photos.map((photo) => (
            <div key={photo.id} className="relative h-28 w-28 overflow-hidden rounded-xl shadow-md sm:h-36 sm:w-36">
              <Image src={photo.url} alt={photo.caption ?? ""} fill sizes="144px" className="object-cover object-top" />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
