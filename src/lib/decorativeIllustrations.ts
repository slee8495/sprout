import { COVER_BACKGROUNDS, type CoverBackground } from "@/lib/covers";

// The full pool of AI-generated (Nano Banana) watercolor animal portraits, used purely as
// decoration on month-divider pages — unlike ANIMAL_ILLUSTRATIONS in animalIllustrations.ts,
// these don't need to match a child's chosen cover animal. Every month chapter page in the album
// picks one deterministically from its "YYYY-MM" key, so the same month always renders the same
// pick (stable across re-renders and web/PDF), and different months land on different animals,
// layouts, sizes, positions and colors without needing any randomness or shared state.
const ILLUSTRATION_POOL = [
  "owl",
  "bunny",
  "giraffe",
  "deer",
  "koala",
  "panda",
  "elephant",
  "lion",
  "frenchie",
  "budgie",
  "sheep",
  "hamster",
  "foal",
  "kitten",
  "puppy",
] as const;

export type DecorativeVariant = "medallion" | "side" | "backdrop" | "corner" | "frame";
const VARIANTS: DecorativeVariant[] = ["medallion", "side", "backdrop", "corner", "frame"];

export type DecorativeSize = "sm" | "md" | "lg";
const SIZES: DecorativeSize[] = ["sm", "md", "lg"];

export type DecorativeCorner = "tl" | "tr" | "bl" | "br";
const CORNERS: DecorativeCorner[] = ["tl", "tr", "bl", "br"];

const BACKGROUNDS: CoverBackground[] = COVER_BACKGROUNDS.map((b) => b.value);

function hashString(value: string): number {
  let h = 0;
  for (let i = 0; i < value.length; i++) h = (Math.imul(h, 31) + value.charCodeAt(i)) | 0;
  return Math.abs(h);
}

// Each property is hashed off a differently-salted key so they vary independently — otherwise a
// single shared hash correlates variant/size/color together and neighboring months would tend to
// look similar (e.g. always "lg" whenever it's "backdrop").
function pick<T>(list: T[], seed: string): T {
  return list[hashString(seed) % list.length];
}

export type MonthDecoration = {
  name: string;
  webPath: string;
  pdfFilename: string;
  variant: DecorativeVariant;
  size: DecorativeSize;
  corner: DecorativeCorner;
  flip: boolean;
  background: CoverBackground;
};

export function decorationForMonth(monthKey: string): MonthDecoration {
  const name = pick([...ILLUSTRATION_POOL], `${monthKey}|animal`);
  return {
    name,
    webPath: `/animal-illustrations/${name}.webp`,
    pdfFilename: `animal-illustrations/${name}.jpg`,
    variant: pick(VARIANTS, `${monthKey}|variant`),
    size: pick(SIZES, `${monthKey}|size`),
    corner: pick(CORNERS, `${monthKey}|corner`),
    flip: hashString(`${monthKey}|flip`) % 2 === 0,
    background: pick(BACKGROUNDS, `${monthKey}|bg`),
  };
}
