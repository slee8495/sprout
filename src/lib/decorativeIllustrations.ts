// The full pool of AI-generated (Nano Banana) watercolor animal portraits, used purely as
// decoration on month-divider pages — unlike ANIMAL_ILLUSTRATIONS in animalIllustrations.ts,
// these don't need to match a child's chosen cover animal. Every month chapter page in the album
// picks deterministically from its position among the album's month pages (not from the "YYYY-MM"
// string itself — a plain hash of adjacent calendar months like "2026-04"/"2026-05" collides often
// enough in practice that April and May landed on the same animal), so the same month always
// renders the same pick (stable across re-renders and web/PDF) and, crucially, no two consecutive
// months ever repeat the same animal or layout.
// Restricted to the requested "cute" set — no budgie (bird) or foal (horse). No tiger artwork
// exists in the set, so lion stands in for it. "강아지" (dog) covers both dog portraits.
const ILLUSTRATION_POOL = [
  "owl",
  "bunny",
  "giraffe",
  "deer",
  "koala",
  "elephant",
  "frenchie",
  "puppy",
  "kitten",
  "hamster",
  "panda",
  "sheep",
  "lion",
] as const;

// Every month page shares this exact background — same matte tone the photo collage tiles use
// (CollagePage.tsx / MATTE_COLOR in pdfPhotos.ts) — and every illustration is shown with
// object-contain, never cropped. A page mixing several different tints, or cropping into an
// animal's face, was the actual complaint; a single consistent color plus "always show the whole
// picture" fixes both at once.
export const DECORATION_MATTE = "#f2ece0";

// Three variants, none of which ever crop the illustration: a portrait box, a left/right split,
// and a big centered "poster" — they differ in the illustration's size and position, not its
// color or whether it gets cut off.
export type DecorativeVariant = "frame" | "side" | "poster";
const VARIANTS: DecorativeVariant[] = ["frame", "side", "poster"];

export type DecorativeSize = "sm" | "md" | "lg";
const SIZES: DecorativeSize[] = ["sm", "md", "lg"];

function hashString(value: string): number {
  let h = 0;
  for (let i = 0; i < value.length; i++) h = (Math.imul(h, 31) + value.charCodeAt(i)) | 0;
  return Math.abs(h);
}

export type MonthDecoration = {
  name: string;
  webPath: string;
  pdfFilename: string;
  variant: DecorativeVariant;
  size: DecorativeSize;
  flip: boolean;
};

// `monthIndex` is the month page's 0-based position among the album's month pages, in
// chronological order (both AlbumView.tsx and the PDF route compute this the same way from the
// same `pages` array, so web and PDF stay in sync). Animal and variant cycle by that index — a
// plain round-robin — which guarantees no immediate repeat; size is offset from variant so the two
// don't lock into the same pairing every cycle. `flip` stays hashed off the month string since a
// repeated coin flip isn't a visible "sameness" problem the way a repeated animal is.
export function decorationForMonth(monthKey: string, monthIndex: number): MonthDecoration {
  const pool = [...ILLUSTRATION_POOL];
  const name = pool[monthIndex % pool.length];
  return {
    name,
    webPath: `/animal-illustrations/${name}.webp`,
    pdfFilename: `animal-illustrations/${name}.jpg`,
    variant: VARIANTS[monthIndex % VARIANTS.length],
    size: SIZES[(monthIndex + 1) % SIZES.length],
    flip: hashString(`${monthKey}|flip`) % 2 === 0,
  };
}
