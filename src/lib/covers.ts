// Album cover options (Library feature): an animal emoji on a pastel background panel.
// Independent of the app-wide color theme in SettingsProvider — each kid/pet picks their own,
// stored as `coverAnimal`/`coverBackground` on the `children` row. The five background keys
// reuse the same palette family as the app's ColorTheme swatches (see globals.css) so the tones
// stay consistent with the rest of the app, but the hex values here are fixed light/dark pairs
// rather than CSS variables, since a cover's color shouldn't change when someone else in the
// family switches their own app-wide theme.
export const COVER_BACKGROUNDS = [
  { value: "green", label: "Sage", light: "#c0dfc9", dark: "#375f46" },
  { value: "ocean", label: "Dusty Blue", light: "#bfd8e9", dark: "#365570" },
  { value: "rose", label: "Dusty Rose", light: "#eac4ca", dark: "#753a47" },
  { value: "lavender", label: "Lavender", light: "#d3c7e6", dark: "#513a70" },
  { value: "sunset", label: "Terracotta", light: "#eac7b4", dark: "#743f29" },
] as const;

export type CoverBackground = (typeof COVER_BACKGROUNDS)[number]["value"];

export const COVER_ANIMALS = [
  "🐰",
  "🦊",
  "🐻",
  "🐼",
  "🐨",
  "🐯",
  "🦁",
  "🦒",
  "🦌",
  "🐘",
  "🐮",
  "🐷",
  "🐸",
  "🐵",
  "🐔",
  "🐧",
  "🦉",
  "🦆",
  "🐺",
  "🦄",
  "🐴",
  "🐗",
  "🐭",
  "🐹",
  "🦔",
  "🐢",
  "🐙",
  "🦕",
  "🐳",
  "🐬",
  "🐝",
  "🦋",
  "🐿️",
] as const;

export function coverBackgroundHex(value: string | null | undefined, dark: boolean) {
  const match = COVER_BACKGROUNDS.find((b) => b.value === value);
  const fallback = COVER_BACKGROUNDS[0];
  const bg = match ?? fallback;
  return dark ? bg.dark : bg.light;
}
