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

export type CollageRect = { area: string; x: number; y: number; width: number; height: number };

function frTrack(spec: string): number[] {
  const fr = spec.split(/\s+/).map((tok) => Number.parseFloat(tok));
  const total = fr.reduce((sum, v) => sum + v, 0);
  const starts: number[] = [];
  let acc = 0;
  for (const v of fr) {
    starts.push(acc / total);
    acc += v;
  }
  starts.push(1);
  return starts; // n tracks -> n+1 boundaries, as fractions of 0..1
}

// PDF export can't use CSS Grid (react-pdf's layout engine is flexbox-only), so this derives the
// same templates' photo placements as plain 0..1 fraction rectangles — the single source of
// truth stays the `gridTemplateAreas` strings above; nothing about the layout is duplicated.
export function getCollageRects(photoCount: number): CollageRect[] {
  const template = getCollageTemplate(photoCount);
  const colBounds = frTrack(template.gridTemplateColumns);
  const rowBounds = frTrack(template.gridTemplateRows);
  const rows = template.gridTemplateAreas
    .trim()
    .split(/"\s*"/)
    .map((row) => row.replace(/"/g, "").trim().split(/\s+/));

  return template.areas.map((area) => {
    let minCol = Infinity;
    let maxCol = -Infinity;
    let minRow = Infinity;
    let maxRow = -Infinity;
    rows.forEach((row, r) => {
      row.forEach((cell, c) => {
        if (cell !== area) return;
        minCol = Math.min(minCol, c);
        maxCol = Math.max(maxCol, c);
        minRow = Math.min(minRow, r);
        maxRow = Math.max(maxRow, r);
      });
    });
    const x = colBounds[minCol];
    const y = rowBounds[minRow];
    return {
      area,
      x,
      y,
      width: colBounds[maxCol + 1] - x,
      height: rowBounds[maxRow + 1] - y,
    };
  });
}
