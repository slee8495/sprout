// Hand-picked AI-generated (Nano Banana) watercolor portraits for a handful of the COVER_ANIMALS
// emoji — used wherever a cover would otherwise just show the bare emoji, so covers for these
// animals look like a little keepsake print instead of a plain glyph. Any emoji without an entry
// here just falls back to the emoji, same as before.
export const ANIMAL_ILLUSTRATIONS: Record<string, string> = {
  "🦉": "/animal-illustrations/owl.webp",
  "🐰": "/animal-illustrations/bunny.webp",
  "🦒": "/animal-illustrations/giraffe.webp",
  "🦌": "/animal-illustrations/deer.webp",
  "🐨": "/animal-illustrations/koala.webp",
  "🐼": "/animal-illustrations/panda.webp",
  "🐘": "/animal-illustrations/elephant.webp",
  "🦁": "/animal-illustrations/lion.webp",
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
