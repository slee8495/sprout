import sharp from "sharp";
import type { AlbumPageData, AlbumPhoto } from "@/lib/albumPages";
import { getCollageRects } from "@/lib/collage";
import { COLLAGE_GAP_PT, titlePhotoSizePt, usableAreaPt } from "@/lib/pdfLayout";

export type PdfPhoto = { id: number; buffer: Buffer; caption: string | null };
export type PdfPageData =
  | { kind: "title"; dates: [string]; label: string; photos: PdfPhoto[] }
  | { kind: "collage"; dates: string[]; photos: PdfPhoto[] }
  | { kind: "month"; dates: [string]; label: string };

// Scales points up to a real pixel resolution before asking sharp to crop — otherwise we'd be
// cropping to a ~200px-wide box, which looks soft once printed/zoomed.
const DPI_SCALE = 3;
const JPEG_QUALITY = 82;
const CONCURRENCY = 6;

// react-pdf's own `objectFit: "cover"` just center-crops, which chops the top off any vertical
// phone photo forced into a wide tile. Cropping ourselves with sharp's "attention" strategy
// (weights toward the most visually salient region — edges/faces/subjects, not just the middle)
// gets meaningfully better results without needing real face detection.
async function smartCropPhoto(photo: AlbumPhoto, targetWidth: number, targetHeight: number): Promise<PdfPhoto> {
  const response = await fetch(photo.url);
  if (!response.ok) throw new Error(`Couldn't fetch photo ${photo.id} for PDF export.`);
  const original = Buffer.from(await response.arrayBuffer());
  const buffer = await sharp(original)
    .rotate()
    .resize(Math.round(targetWidth), Math.round(targetHeight), {
      fit: "cover",
      position: sharp.strategy.attention,
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

export async function preparePhotosForPdf(
  pages: AlbumPageData[],
  orientation: "portrait" | "landscape",
): Promise<PdfPageData[]> {
  const usable = usableAreaPt(orientation);

  const tasks: { photo: AlbumPhoto; width: number; height: number }[] = [];
  for (const page of pages) {
    if (page.kind === "title") {
      const size = titlePhotoSizePt(page.photos.length, usable.width);
      for (const photo of page.photos) {
        tasks.push({ photo, width: size * DPI_SCALE, height: size * DPI_SCALE });
      }
    } else if (page.kind === "collage") {
      const rects = getCollageRects(page.photos.length);
      page.photos.forEach((photo, i) => {
        const rect = rects[i];
        const width = usable.width * rect.width - COLLAGE_GAP_PT;
        const height = usable.height * rect.height - COLLAGE_GAP_PT;
        tasks.push({ photo, width: width * DPI_SCALE, height: height * DPI_SCALE });
      });
    }
  }

  const resized = await mapWithConcurrency(tasks, CONCURRENCY, (t) => smartCropPhoto(t.photo, t.width, t.height));
  const byId = new Map(resized.map((p) => [p.id, p]));

  return pages.map((page) =>
    page.kind === "month" ? page : { ...page, photos: page.photos.map((p) => byId.get(p.id)!) },
  );
}
