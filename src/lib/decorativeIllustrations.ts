// The full pool of AI-generated (Nano Banana) watercolor animal portraits, used purely as
// decoration on month-divider pages — unlike ANIMAL_ILLUSTRATIONS in animalIllustrations.ts,
// these don't need to match a child's chosen cover animal. Every month chapter page in the album
// picks one deterministically from its "YYYY-MM" key, so the same month always renders the same
// pick (stable across re-renders and web/PDF), and different months land on different animals and
// layouts without needing any randomness or shared state.
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

export type DecorativeVariant = "medallion" | "side" | "backdrop";
const VARIANTS: DecorativeVariant[] = ["medallion", "side", "backdrop"];

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
  flip: boolean;
};

export function decorationForMonth(monthKey: string): MonthDecoration {
  const h = hashString(monthKey);
  const name = ILLUSTRATION_POOL[h % ILLUSTRATION_POOL.length];
  const variant = VARIANTS[Math.floor(h / ILLUSTRATION_POOL.length) % VARIANTS.length];
  const flip = Math.floor(h / (ILLUSTRATION_POOL.length * VARIANTS.length)) % 2 === 0;
  return {
    name,
    webPath: `/animal-illustrations/${name}.webp`,
    pdfFilename: `animal-illustrations/${name}.jpg`,
    variant,
    flip,
  };
}
