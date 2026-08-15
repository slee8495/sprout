// Shared page-geometry constants for the album PDF — used by both the photo-preparation step
// (pdfPhotos.ts, which needs exact pixel targets to fit each photo to) and the document
// component itself (AlbumPdfDocument.tsx, which needs the same numbers to lay out styles).
// Keeping them in one place means the two can never drift out of sync.
// Landscape-only, always — an A4 sheet turned on its side (matches the web album, which is
// also locked to a 4:3 landscape frame).
export const PAGE_PT = { width: 841.89, height: 595.28 };
export const PAGE_PADDING_PT = 24;
export const COLLAGE_GAP_PT = 6;
// Every content page (collage or milestone) reserves this much height at the top for its small
// date/label caption — both "title" and "collage" kinds use the exact same collage grid below it.
export const CAPTION_HEIGHT_PT = 20;

export function usableAreaPt() {
  return { width: PAGE_PT.width - PAGE_PADDING_PT * 2, height: PAGE_PT.height - PAGE_PADDING_PT * 2 };
}

// The area actually available to the photo grid, after the page padding and the caption row.
export function collageAreaPt() {
  const usable = usableAreaPt();
  return { width: usable.width, height: usable.height - CAPTION_HEIGHT_PT };
}
