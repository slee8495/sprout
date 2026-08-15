// Fixed collage grid templates for the Album Library's photo pages, keyed by photo count (1–5).
// Real photobook apps use a template-per-count set rather than a general-purpose auto-layout
// algorithm — it guarantees every page looks intentional without needing bin-packing logic.
// Columns/rows use fr units (relative), so the same templates reflow cleanly for both portrait
// and landscape page orientation, and are reused as-is for the PDF export in a later phase.
export const MAX_COLLAGE_PHOTOS = 5;

export type CollageTemplate = {
  areas: string[];
  gridTemplateColumns: string;
  gridTemplateRows: string;
  gridTemplateAreas: string;
};

const TEMPLATES: Record<number, CollageTemplate> = {
  1: {
    areas: ["a"],
    gridTemplateColumns: "1fr",
    gridTemplateRows: "1fr",
    gridTemplateAreas: `"a"`,
  },
  2: {
    areas: ["a", "b"],
    gridTemplateColumns: "3fr 2fr",
    gridTemplateRows: "1fr",
    gridTemplateAreas: `"a b"`,
  },
  3: {
    areas: ["a", "b", "c"],
    gridTemplateColumns: "2fr 1fr",
    gridTemplateRows: "1fr 1fr",
    gridTemplateAreas: `"a b" "a c"`,
  },
  4: {
    areas: ["a", "b", "c", "d"],
    gridTemplateColumns: "3fr 2fr",
    gridTemplateRows: "3fr 2fr",
    gridTemplateAreas: `"a b" "c d"`,
  },
  5: {
    areas: ["a", "b", "c", "d", "e"],
    gridTemplateColumns: "1fr 2fr 1fr",
    gridTemplateRows: "1fr 1fr",
    gridTemplateAreas: `"a b c" "d b e"`,
  },
};

export function getCollageTemplate(photoCount: number): CollageTemplate {
  const count = Math.min(Math.max(photoCount, 1), MAX_COLLAGE_PHOTOS);
  return TEMPLATES[count];
}
