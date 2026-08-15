import Image from "next/image";
import type { CSSProperties } from "react";
import { decorationForMonth } from "@/lib/decorativeIllustrations";
import { coverBackgroundHex } from "@/lib/covers";
import { formatMonthLabel } from "@/lib/milestones";

// The AI-generated-illustration disclosure lives once, up top on the album screen
// (AlbumView's header) — not repeated on every month divider page.
export function MonthDividerPage({ date, coverBackground }: { date: string; coverBackground: string | null }) {
  const decoration = decorationForMonth(date.slice(0, 7));
  const label = formatMonthLabel(date);
  const bgVars = {
    "--cover-light": coverBackgroundHex(coverBackground, false),
    "--cover-dark": coverBackgroundHex(coverBackground, true),
  } as CSSProperties;

  if (decoration.variant === "backdrop") {
    return (
      <div className="relative flex h-full w-full items-end overflow-hidden">
        <Image src={decoration.webPath} alt="" fill sizes="700px" className="object-cover" />
        <div className="relative z-10 flex w-full flex-col items-center gap-1 px-6 pb-4 text-center">
          <div className="rounded-2xl bg-white/85 px-6 py-3 shadow-md backdrop-blur-sm dark:bg-zinc-900/80">
            <h2 className="font-[family-name:var(--font-album-serif)] text-3xl font-semibold text-zinc-800 sm:text-4xl dark:text-zinc-100">
              {label}
            </h2>
          </div>
        </div>
      </div>
    );
  }

  if (decoration.variant === "side") {
    return (
      <div
        className={`flex h-full w-full items-stretch bg-[var(--cover-light)] dark:bg-[var(--cover-dark)] ${decoration.flip ? "flex-row-reverse" : "flex-row"}`}
        style={bgVars}
      >
        <div className="relative w-2/5 shrink-0 overflow-hidden">
          <Image src={decoration.webPath} alt="" fill sizes="400px" className="object-cover" />
        </div>
        <div className="flex flex-1 flex-col items-center justify-center gap-3 px-4 text-center">
          <span className="h-px w-10 bg-zinc-800/25 dark:bg-zinc-100/25" />
          <h2 className="font-[family-name:var(--font-album-serif)] text-3xl font-semibold text-zinc-800 sm:text-4xl dark:text-zinc-100">
            {label}
          </h2>
        </div>
      </div>
    );
  }

  return (
    <div
      className="flex h-full w-full flex-col items-center justify-center gap-4 overflow-hidden bg-[var(--cover-light)] px-6 text-center dark:bg-[var(--cover-dark)]"
      style={bgVars}
    >
      <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-full shadow-md shadow-black/10 ring-4 ring-white/60 dark:ring-white/10">
        <Image src={decoration.webPath} alt="" fill sizes="96px" className="object-cover" />
      </div>
      <span className="h-px w-10 bg-zinc-800/25 dark:bg-zinc-100/25" />
      <h2 className="font-[family-name:var(--font-album-serif)] text-4xl font-semibold text-zinc-800 sm:text-5xl dark:text-zinc-100">
        {label}
      </h2>
    </div>
  );
}
