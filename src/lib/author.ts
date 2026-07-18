const AUTHOR_STYLES: Record<string, string> = {
  dad: "bg-sky-100 text-sky-800 dark:bg-sky-900/50 dark:text-sky-200",
  mom: "bg-pink-100 text-pink-800 dark:bg-pink-900/50 dark:text-pink-200",
};

const DEFAULT_STYLE = "bg-violet-100 text-violet-800 dark:bg-violet-900/50 dark:text-violet-200";

export function authorBadgeClasses(name?: string | null) {
  if (!name) return DEFAULT_STYLE;
  return AUTHOR_STYLES[name.toLowerCase()] ?? DEFAULT_STYLE;
}
