import sharp from "sharp";
import type { AlbumPageData, AlbumPhoto } from "@/lib/albumPages";
import { getCollageRects } from "@/lib/collage";
import { collageAreaPt, COLLAGE_GAP_PT } from "@/lib/pdfLayout";

export type PdfPhoto = { id: number; buffer: Buffer; caption: string | null };
export type PdfPageData =
  | { kind: "title"; dates: [string]; label: string; photos: PdfPhoto[] }
  | { kind: "collage"; dates: string[]; photos: PdfPhoto[] }
  | { kind: "month"; dates: [string]; label: string };

// Scales points up to a real pixel resolution before asking sharp to render — otherwise we'd be
// fitting into a ~200px-wide box, which looks soft once printed/zoomed.
const DPI_SCALE = 3;
const JPEG_QUALITY = 82;
const CONCURRENCY = 6;
// Matches the web album's collage-tile matting (CollagePage.tsx) so a photo whose aspect ratio
// doesn't match its tile looks intentionally matted, not like an empty gap.
const MATTE_COLOR = "#f2ece0";

// Cropping to fill a tile (center, top-biased, even sharp's "attention" saliency guess) reliably
// cuts someone's face off often enough in real family photos — a baby lower in frame than the
// adult holding them, a wide group shot squeezed into a narrow slot — that showing the whole
// photo with a little matting beats risking that. `fit: "contain"` guarantees nothing is ever
// cropped; the output buffer is exactly targetWidth x targetHeight either way.
async function fitPhoto(photo: AlbumPhoto, targetWidth: number, targetHeight: number): Promise<PdfPhoto> {
  const response = await fetch(photo.url);
  if (!response.ok) throw new Error(`Couldn't fetch photo ${photo.id} for PDF export.`);
  const original = Buffer.from(await response.arrayBuffer());
  const buffer = await sharp(original)
    .rotate()
    .resize(Math.round(targetWidth), Math.round(targetHeight), {
      fit: "contain",
      background: MATTE_COLOR,
    })
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
  const area = collageAreaPt();

  const tasks: { photo: AlbumPhoto; width: number; height: number }[] = [];
  for (const page of pages) {
    if (page.kind === "month") continue;
    const rects = getCollageRects(page.photos.length);
    page.photos.forEach((photo, i) => {
      const rect = rects[i];
      const width = area.width * rect.width - COLLAGE_GAP_PT;
      const height = area.height * rect.height - COLLAGE_GAP_PT;
      tasks.push({ photo, width: width * DPI_SCALE, height: height * DPI_SCALE });
    });
  }

  const resized = await mapWithConcurrency(tasks, CONCURRENCY, (t) => fitPhoto(t.photo, t.width, t.height));
  const byId = new Map(resized.map((p) => [p.id, p]));

  return pages.map((page) =>
    page.kind === "month" ? page : { ...page, photos: page.photos.map((p) => byId.get(p.id)!) },
  );
}
