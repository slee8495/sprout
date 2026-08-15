import type { JournalEntryWithPhotos } from "@/db/queries";
import { MAX_COLLAGE_PHOTOS } from "@/lib/collage";

export type AlbumPhoto = { id: number; url: string; caption: string | null };
// `dates` holds every calendar date whose photos ended up on this page — usually one date, but a
// "collage" page can span a short run of light days that got merged together (see
// SPARSE_DAY_THRESHOLD below). "title" pages are never merged, so `dates` is always a single date
// there, kept as an array for a uniform shape.
export type AlbumPageData =
  | { kind: "title"; dates: [string]; label: string; photos: AlbumPhoto[] }
  | { kind: "collage"; dates: string[]; photos: AlbumPhoto[] };

// A day with fewer photos than this doesn't get its own near-empty page — its photos merge into
// a shared page with neighboring light days instead.
const SPARSE_DAY_THRESHOLD = 3;
// A day with more photos than this (e.g. a whole photoshoot in one outfit) gets thinned down to
// evenly-spaced picks rather than every near-duplicate shot filling page after page.
const MAX_PHOTOS_PER_DAY = 8;

function sampleEvenly<T>(items: T[], max: number): T[] {
  if (items.length <= max) return items;
  const step = items.length / max;
  return Array.from({ length: max }, (_, i) => items[Math.floor(i * step)]);
}

function chunk<T>(items: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < items.length; i += size) chunks.push(items.slice(i, i + size));
  return chunks;
}

// Shared between the web album view (scroll/page-turn) and the PDF export — both need the exact
// same date grouping, milestone title pages, and photo selection so what you see in the app is
// what you get in the PDF.
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
  let pending: { dates: string[]; photos: AlbumPhoto[] } | null = null;

  function flushPending() {
    if (!pending) return;
    const { dates, photos } = pending;
    pending = null;
    if (photos.length === 0) return;
    for (const group of chunk(photos, MAX_COLLAGE_PHOTOS)) {
      pages.push({ kind: "collage", dates, photos: group });
    }
  }

  for (const date of order) {
    const dayEntries = byDate.get(date)!;
    const milestoneEntry = dayEntries.find((e) => e.milestoneLabel);
    let pool: AlbumPhoto[] = dayEntries.flatMap((e) => e.photos);

    if (milestoneEntry) {
      // Milestone days always stand alone with their own title page — never merged into a
      // neighboring light day's page, even if this day itself only had a couple of photos.
      flushPending();
      const accents = sampleEvenly(milestoneEntry.photos, 4);
      const accentIds = new Set(accents.map((p) => p.id));
      pool = pool.filter((p) => !accentIds.has(p.id));
      pages.push({ kind: "title", dates: [date], label: milestoneEntry.milestoneLabel!, photos: accents });
      for (const group of chunk(sampleEvenly(pool, MAX_PHOTOS_PER_DAY), MAX_COLLAGE_PHOTOS)) {
        pages.push({ kind: "collage", dates: [date], photos: group });
      }
      continue;
    }

    const dayPhotos = sampleEvenly(pool, MAX_PHOTOS_PER_DAY);

    if (dayPhotos.length >= SPARSE_DAY_THRESHOLD) {
      flushPending();
      for (const group of chunk(dayPhotos, MAX_COLLAGE_PHOTOS)) {
        pages.push({ kind: "collage", dates: [date], photos: group });
      }
    } else {
      if (!pending) pending = { dates: [], photos: [] };
      pending.dates.push(date);
      pending.photos.push(...dayPhotos);
      if (pending.photos.length >= MAX_COLLAGE_PHOTOS) flushPending();
    }
  }
  flushPending();

  return pages;
}

export function sortAlbumEntries<T extends { entryDate: string }>(entries: T[], order: "oldest" | "latest"): T[] {
  const sorted = [...entries].sort((a, b) => (a.entryDate < b.entryDate ? -1 : a.entryDate > b.entryDate ? 1 : 0));
  if (order === "latest") sorted.reverse();
  return sorted;
}
