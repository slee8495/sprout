// Hand-picked AI-generated (Nano Banana) watercolor portraits, one per emoji. This is the
// complete set of animals with real artwork — COVER_ANIMALS (covers.ts) is derived directly from
// these keys, so the cover picker only ever offers animals that render as a real illustration,
// never a bare emoji.
export const ANIMAL_ILLUSTRATIONS: Record<string, string> = {
  "🦉": "/animal-illustrations/owl.webp",
  "🐰": "/animal-illustrations/bunny.webp",
  "🦒": "/animal-illustrations/giraffe.webp",
  "🦌": "/animal-illustrations/deer.webp",
  "🐨": "/animal-illustrations/koala.webp",
  "🐼": "/animal-illustrations/panda.webp",
  "🐘": "/animal-illustrations/elephant.webp",
  "🦁": "/animal-illustrations/lion.webp",
  "🐶": "/animal-illustrations/frenchie.webp",
  "🐕": "/animal-illustrations/puppy.webp",
  "🐱": "/animal-illustrations/kitten.webp",
  "🐑": "/animal-illustrations/sheep.webp",
  "🐹": "/animal-illustrations/hamster.webp",
  "🐴": "/animal-illustrations/foal.webp",
  "🐦": "/animal-illustrations/budgie.webp",
};

export function illustrationForAnimal(animal: string | null | undefined): string | null {
  if (!animal) return null;
  return ANIMAL_ILLUSTRATIONS[animal] ?? null;
}

// Same set, but the on-disk filename for the PDF export route — react-pdf's <Image> only decodes
// JPEG/PNG (no WebP support), so the PDF reads a JPEG copy of the same crop via `fs`/`path.join`
// rather than fetching the WebP used by the web app.
export function illustrationFilenameForAnimal(animal: string | null | undefined): string | null {
  const webPath = illustrationForAnimal(animal);
  if (!webPath) return null;
  return webPath.replace(/\.webp$/, ".jpg");
}
