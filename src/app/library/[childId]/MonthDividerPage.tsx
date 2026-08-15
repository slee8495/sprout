import type { CSSProperties } from "react";
import { coverBackgroundHex } from "@/lib/covers";
import { formatMonthLabel } from "@/lib/milestones";

export function MonthDividerPage({ date, coverBackground }: { date: string; coverBackground: string | null }) {
  return (
    <div
      className="flex h-full w-full flex-col items-center justify-center gap-4 bg-[var(--cover-light)] px-6 text-center dark:bg-[var(--cover-dark)]"
      style={
        {
          "--cover-light": coverBackgroundHex(coverBackground, false),
          "--cover-dark": coverBackgroundHex(coverBackground, true),
        } as CSSProperties
      }
    >
      <span className="h-px w-10 bg-zinc-800/25 dark:bg-zinc-100/25" />
      <h2 className="font-[family-name:var(--font-album-serif)] text-4xl font-semibold text-zinc-800 sm:text-5xl dark:text-zinc-100">
        {formatMonthLabel(date)}
      </h2>
    </div>
  );
}
