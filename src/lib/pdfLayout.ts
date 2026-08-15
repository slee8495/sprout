// Shared page-geometry constants for the album PDF — used by both the photo-preparation step
// (pdfPhotos.ts, which needs exact pixel targets to fit each photo to) and the document
// component itself (AlbumPdfDocument.tsx, which needs the same numbers to lay out styles).
// Keeping them in one place means the two can never drift out of sync.
export const PAGE_PT = { width: 595.28, height: 841.89 }; // A4 portrait, points
export const PAGE_PADDING_PT = 24;
export const COLLAGE_GAP_PT = 6;
// Every content page (collage or milestone) reserves this much height at the top for its small
// date/label caption — both "title" and "collage" kinds use the exact same collage grid below it.
export const CAPTION_HEIGHT_PT = 20;

export function usableAreaPt(orientation: "portrait" | "landscape") {
  const { width, height } =
    orientation === "landscape" ? { width: PAGE_PT.height, height: PAGE_PT.width } : PAGE_PT;
  return { width: width - PAGE_PADDING_PT * 2, height: height - PAGE_PADDING_PT * 2 };
}

// The area actually available to the photo grid, after the page padding and the caption row.
export function collageAreaPt(orientation: "portrait" | "landscape") {
  const usable = usableAreaPt(orientation);
  return { width: usable.width, height: usable.height - CAPTION_HEIGHT_PT };
}
