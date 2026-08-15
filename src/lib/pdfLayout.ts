// Shared page-geometry constants for the album PDF — used by both the photo-preparation step
// (pdfPhotos.ts, which needs exact pixel targets to crop each photo to) and the document
// component itself (AlbumPdfDocument.tsx, which needs the same numbers to lay out styles).
// Keeping them in one place means the two can never drift out of sync.
export const PAGE_PT = { width: 595.28, height: 841.89 }; // A4 portrait, points
export const PAGE_PADDING_PT = 24;
export const COLLAGE_GAP_PT = 6;
export const TITLE_PHOTO_MAX_PT = 170;
export const TITLE_PHOTO_GAP_PT = 8;

export function usableAreaPt(orientation: "portrait" | "landscape") {
  const { width, height } =
    orientation === "landscape" ? { width: PAGE_PT.height, height: PAGE_PT.width } : PAGE_PT;
  return { width: width - PAGE_PADDING_PT * 2, height: height - PAGE_PADDING_PT * 2 };
}

// Milestone title-page accent photos default to a generous fixed size (much bigger than a
// thumbnail) but shrink just enough to still fit if there are more than a couple of them.
export function titlePhotoSizePt(count: number, usableWidthPt: number): number {
  if (count <= 0) return 0;
  const bound = (usableWidthPt - (count - 1) * TITLE_PHOTO_GAP_PT) / count;
  return Math.min(TITLE_PHOTO_MAX_PT, bound);
}
