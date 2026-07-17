export const MILESTONE_OPTIONS: { value: string; label: string }[] = [
  { value: "first_smile", label: "First smile" },
  { value: "first_laugh", label: "First laugh" },
  { value: "first_solid_food", label: "First solid food" },
  { value: "first_tooth", label: "First tooth" },
  { value: "first_word", label: "First word" },
  { value: "first_steps", label: "First steps" },
  { value: "first_haircut", label: "First haircut" },
  { value: "other", label: "Other milestone" },
];

export const MILESTONE_LABELS: Record<string, string> = Object.fromEntries(
  MILESTONE_OPTIONS.map((m) => [m.value, m.label]),
);

export function formatEntryDate(dateStr: string) {
  return new Date(`${dateStr}T00:00:00`).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}
