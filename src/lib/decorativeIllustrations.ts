// The full pool of AI-generated (Nano Banana) watercolor animal portraits, used purely as
// decoration on month-divider pages — unlike ANIMAL_ILLUSTRATIONS in animalIllustrations.ts,
// these don't need to match a child's chosen cover animal. Every month chapter page in the album
// picks one deterministically from its "YYYY-MM" key, so the same month always renders the same
// pick (stable across re-renders and web/PDF), and different months land on different animals,
// sizes and positions without needing any randomness or shared state.
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

// Each property is hashed off a differently-salted key so they vary independently — otherwise a
// single shared hash correlates variant/size together and neighboring months would tend to look
// similar (e.g. always "lg" whenever it's "side").
function pick<T>(list: T[], seed: string): T {
  return list[hashString(seed) % list.length];
}

export type MonthDecoration = {
  name: string;
  webPath: string;
  pdfFilename: string;
  variant: DecorativeVariant;
  size: DecorativeSize;
  flip: boolean;
};

export function decorationForMonth(monthKey: string): MonthDecoration {
  const name = pick([...ILLUSTRATION_POOL], `${monthKey}|animal`);
  return {
    name,
    webPath: `/animal-illustrations/${name}.webp`,
    pdfFilename: `animal-illustrations/${name}.jpg`,
    variant: pick(VARIANTS, `${monthKey}|variant`),
    size: pick(SIZES, `${monthKey}|size`),
    flip: hashString(`${monthKey}|flip`) % 2 === 0,
  };
}
