"use client";

import Image from "next/image";
import type { JournalEntryWithPhotos } from "@/db/queries";

type Photo = JournalEntryWithPhotos["photos"][number];

export function PhotoCollage({ photos, onOpen }: { photos: Photo[]; onOpen: (index: number) => void }) {
  if (photos.length === 0) return null;

  if (photos.length === 1) {
    return (
      <button type="button" onClick={() => onOpen(0)} className="block w-full">
        <Image
          src={photos[0].url}
          alt={photos[0].caption ?? ""}
          width={500}
          height={500}
          className="aspect-square w-full rounded-2xl object-cover"
        />
      </button>
    );
  }

  if (photos.length === 2) {
    return (
      <div className="grid aspect-square grid-cols-2 gap-1 overflow-hidden rounded-2xl">
        {photos.map((photo, i) => (
          <button key={photo.id} type="button" onClick={() => onOpen(i)} className="relative h-full w-full">
            <Image src={photo.url} alt={photo.caption ?? ""} fill sizes="50vw" className="object-cover" />
          </button>
        ))}
      </div>
    );
  }

  if (photos.length === 3) {
    return (
      <div className="grid aspect-square grid-cols-2 grid-rows-2 gap-1 overflow-hidden rounded-2xl">
        <button
          type="button"
          onClick={() => onOpen(0)}
          className="relative row-span-2 h-full w-full"
        >
          <Image src={photos[0].url} alt={photos[0].caption ?? ""} fill sizes="50vw" className="object-cover" />
        </button>
        {photos.slice(1).map((photo, i) => (
          <button key={photo.id} type="button" onClick={() => onOpen(i + 1)} className="relative h-full w-full">
            <Image src={photo.url} alt={photo.caption ?? ""} fill sizes="50vw" className="object-cover" />
          </button>
        ))}
      </div>
    );
  }

  const shown = photos.slice(0, 4);
  const remaining = photos.length - 4;
  return (
    <div className="grid aspect-square grid-cols-2 grid-rows-2 gap-1 overflow-hidden rounded-2xl">
      {shown.map((photo, i) => (
        <button key={photo.id} type="button" onClick={() => onOpen(i)} className="relative h-full w-full">
          <Image src={photo.url} alt={photo.caption ?? ""} fill sizes="50vw" className="object-cover" />
          {i === 3 && remaining > 0 && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/50 font-heading text-lg font-bold text-white">
              +{remaining}
            </div>
          )}
        </button>
      ))}
    </div>
  );
}
