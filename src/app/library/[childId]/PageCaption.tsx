import { formatEntryDate } from "@/lib/milestones";

function formatDateRange(dates: string[]) {
  const sorted = [...dates].sort();
  const first = formatEntryDate(sorted[0]);
  const last = formatEntryDate(sorted[sorted.length - 1]);
  return first === last ? first : `${first} – ${last}`;
}

export function PageCaption({ dates, label }: { dates: string[]; label?: string }) {
  return (
    <div className="flex shrink-0 items-baseline justify-center gap-1.5 pb-1.5 text-center">
      <span className="text-[10px] font-semibold uppercase tracking-[0.15em] text-zinc-500 dark:text-zinc-400">
        {formatDateRange(dates)}
      </span>
      {label && (
        <span className="font-[family-name:var(--font-album-serif)] text-xs font-semibold text-zinc-700 dark:text-zinc-200">
          · {label}
        </span>
      )}
    </div>
  );
}
