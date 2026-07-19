export const MILESTONE_CATEGORIES: { value: string; label: string; emoji: string }[] = [
  { value: "food", label: "Food", emoji: "🍽️" },
  { value: "social", label: "Social", emoji: "🫂" },
  { value: "physical", label: "Physical", emoji: "🏃" },
  { value: "language", label: "Language", emoji: "🗣️" },
  { value: "health", label: "Health", emoji: "🩺" },
  { value: "place", label: "Place", emoji: "📍" },
  { value: "other", label: "Other", emoji: "🏅" },
];

export const MILESTONE_CATEGORY_LABELS: Record<string, string> = Object.fromEntries(
  MILESTONE_CATEGORIES.map((c) => [c.value, c.label]),
);

export const MILESTONE_CATEGORY_EMOJI: Record<string, string> = Object.fromEntries(
  MILESTONE_CATEGORIES.map((c) => [c.value, c.emoji]),
);

export function formatEntryDate(dateStr: string) {
  return new Date(`${dateStr}T00:00:00`).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}
