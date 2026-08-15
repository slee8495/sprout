import type { JournalEntryWithPhotos } from "@/db/queries";
import { MAX_COLLAGE_PHOTOS } from "@/lib/collage";

export type AlbumPhoto = { id: number; url: string; caption: string | null };
export type AlbumPageData =
  | { kind: "title"; date: string; label: string; photos: AlbumPhoto[] }
  | { kind: "collage"; date: string; photos: AlbumPhoto[] };

// Shared between the web album view (scroll/page-turn) and the PDF export — both need the exact
// same date grouping, milestone title pages, and per-day photo chunking so what you see in the
// app is what you get in the PDF.
export function buildAlbumPages(entries: JournalEntryWithPhotos[]): AlbumPageData[] {
  const byDate = new Map<string, JournalEntryWithPhotos[]>();
  const order: string[] = [];
  for (const entry of entries) {
    if (!byDate.has(entry.entryDate)) {
      byDate.set(entry.entryDate, []);
      order.push(entry.entryDate);
    }
    byDate.get(entry.entryDate)!.push(entry);
  }

  const pages: AlbumPageData[] = [];
  for (const date of order) {
    const dayEntries = byDate.get(date)!;
    const milestoneEntry = dayEntries.find((e) => e.milestoneLabel);
    let pool: AlbumPhoto[] = dayEntries.flatMap((e) => e.photos);

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

export function sortAlbumEntries<T extends { entryDate: string }>(entries: T[], order: "oldest" | "latest"): T[] {
  const sorted = [...entries].sort((a, b) => (a.entryDate < b.entryDate ? -1 : a.entryDate > b.entryDate ? 1 : 0));
  if (order === "latest") sorted.reverse();
  return sorted;
}
