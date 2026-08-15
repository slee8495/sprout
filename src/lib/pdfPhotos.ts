import sharp from "sharp";
import type { AlbumPageData, AlbumPhoto } from "@/lib/albumPages";

export type PdfPhoto = { id: number; buffer: Buffer; caption: string | null };
export type PdfPageData =
  | { kind: "title"; date: string; label: string; photos: PdfPhoto[] }
  | { kind: "collage"; date: string; photos: PdfPhoto[] };

// PDF pages embed the actual pixel data (unlike the web view, which just points <img> at the
// CDN URL), so a full-resolution family photo library would either blow past the function's
// memory limit or take minutes per export. Downscaling + re-encoding every photo before handing
// it to react-pdf keeps both memory and file size in check regardless of how many original
// megapixels a phone camera produced.
const MAX_DIMENSION = 1600;
const JPEG_QUALITY = 82;
const CONCURRENCY = 6;

async function resizePhoto(photo: AlbumPhoto): Promise<PdfPhoto> {
  const response = await fetch(photo.url);
  if (!response.ok) throw new Error(`Couldn't fetch photo ${photo.id} for PDF export.`);
  const original = Buffer.from(await response.arrayBuffer());
  const buffer = await sharp(original)
    .rotate() // apply EXIF orientation before resizing
    .resize({ width: MAX_DIMENSION, height: MAX_DIMENSION, fit: "inside", withoutEnlargement: true })
    .jpeg({ quality: JPEG_QUALITY })
    .toBuffer();
  return { id: photo.id, buffer, caption: photo.caption };
}

async function mapWithConcurrency<T, R>(items: T[], limit: number, fn: (item: T) => Promise<R>): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let next = 0;
  async function worker() {
    while (next < items.length) {
      const i = next++;
      results[i] = await fn(items[i]);
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));
  return results;
}

export async function preparePhotosForPdf(pages: AlbumPageData[]): Promise<PdfPageData[]> {
  const allPhotos = pages.flatMap((p) => p.photos);
  const resized = await mapWithConcurrency(allPhotos, CONCURRENCY, resizePhoto);
  const byId = new Map(resized.map((p) => [p.id, p]));

  return pages.map((page) => ({
    ...page,
    photos: page.photos.map((p) => byId.get(p.id)!),
  }));
}
