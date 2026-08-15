import Image from "next/image";
import { formatEntryDate } from "@/lib/milestones";

type Photo = { id: number; url: string; caption: string | null };

export function MilestoneTitlePage({
  date,
  label,
  photos,
  coverAnimal,
}: {
  date: string;
  label: string;
  photos: Photo[];
  coverAnimal: string;
}) {
  return (
    <div className="flex h-full w-full flex-col items-center justify-center gap-6 px-6 text-center">
      <span className="text-3xl">{coverAnimal}</span>
      <div className="flex flex-col gap-2">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500 dark:text-zinc-400">
          {formatEntryDate(date)}
        </p>
        <h2 className="font-[family-name:var(--font-album-serif)] text-4xl font-semibold text-zinc-800 sm:text-5xl dark:text-zinc-100">
          {label}
        </h2>
      </div>
      {photos.length > 0 && (
        <div className="flex gap-2">
          {photos.map((photo) => (
            <div key={photo.id} className="relative h-20 w-20 overflow-hidden rounded-lg shadow-sm sm:h-28 sm:w-28">
              <Image src={photo.url} alt={photo.caption ?? ""} fill sizes="112px" className="object-cover object-top" />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
