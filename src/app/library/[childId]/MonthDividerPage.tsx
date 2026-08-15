import Image from "next/image";
import type { CSSProperties } from "react";
import { decorationForMonth, type DecorativeCorner, type DecorativeSize } from "@/lib/decorativeIllustrations";
import { coverBackgroundHex } from "@/lib/covers";
import { formatMonthLabel } from "@/lib/milestones";

const MEDALLION_PX: Record<DecorativeSize, number> = { sm: 72, md: 96, lg: 128 };
const SIDE_WIDTH_PCT: Record<DecorativeSize, number> = { sm: 32, md: 40, lg: 50 };
const CORNER_PX: Record<DecorativeSize, number> = { sm: 100, md: 140, lg: 180 };
const FRAME_PX: Record<DecorativeSize, number> = { sm: 130, md: 170, lg: 210 };
const CORNER_POSITION: Record<DecorativeCorner, CSSProperties> = {
  tl: { top: 16, left: 16 },
  tr: { top: 16, right: 16 },
  bl: { bottom: 16, left: 16 },
  br: { bottom: 16, right: 16 },
};

// The AI-illustration disclosure lives once, up top on the album screen (AlbumView's header) —
// not repeated on every month divider page. Each month independently varies illustration, layout,
// size, position, and background color (decorationForMonth) so a long album doesn't feel like the
// same chapter page repeated over and over.
export function MonthDividerPage({ date }: { date: string }) {
  const decoration = decorationForMonth(date.slice(0, 7));
  const label = formatMonthLabel(date);
  const bgVars = {
    "--cover-light": coverBackgroundHex(decoration.background, false),
    "--cover-dark": coverBackgroundHex(decoration.background, true),
  } as CSSProperties;

  if (decoration.variant === "backdrop") {
    return (
      <div
        className={`relative flex h-full w-full overflow-hidden ${decoration.flip ? "items-start" : "items-end"}`}
      >
        <Image src={decoration.webPath} alt="" fill sizes="700px" className="object-cover" />
        <div
          className={`relative z-10 flex w-full flex-col items-center gap-1 px-6 text-center ${decoration.flip ? "pt-4" : "pb-4"}`}
        >
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
    const widthPct = SIDE_WIDTH_PCT[decoration.size];
    return (
      <div
        className={`flex h-full w-full items-stretch bg-[var(--cover-light)] dark:bg-[var(--cover-dark)] ${decoration.flip ? "flex-row-reverse" : "flex-row"}`}
        style={bgVars}
      >
        <div className="relative shrink-0 overflow-hidden" style={{ width: `${widthPct}%` }}>
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

  if (decoration.variant === "corner") {
    const px = CORNER_PX[decoration.size];
    return (
      <div
        className="relative flex h-full w-full items-center justify-center overflow-hidden bg-[var(--cover-light)] px-6 text-center dark:bg-[var(--cover-dark)]"
        style={bgVars}
      >
        <div
          className="absolute overflow-hidden rounded-2xl shadow-lg shadow-black/10 ring-4 ring-white/60 dark:ring-white/10"
          style={{ width: px, height: px, ...CORNER_POSITION[decoration.corner] }}
        >
          <Image src={decoration.webPath} alt="" fill sizes={`${px}px`} className="object-cover" />
        </div>
        <div className="flex flex-col items-center gap-3">
          <span className="h-px w-10 bg-zinc-800/25 dark:bg-zinc-100/25" />
          <h2 className="font-[family-name:var(--font-album-serif)] text-4xl font-semibold text-zinc-800 sm:text-5xl dark:text-zinc-100">
            {label}
          </h2>
        </div>
      </div>
    );
  }

  if (decoration.variant === "frame") {
    const px = FRAME_PX[decoration.size];
    return (
      <div
        className="flex h-full w-full flex-col items-center justify-center gap-4 overflow-hidden bg-[var(--cover-light)] px-6 text-center dark:bg-[var(--cover-dark)]"
        style={bgVars}
      >
        <div className="relative shrink-0 overflow-hidden rounded-lg bg-white p-1.5 shadow-lg shadow-black/15 dark:bg-zinc-900">
          <div className="relative overflow-hidden rounded" style={{ width: px, height: px }}>
            <Image src={decoration.webPath} alt="" fill sizes={`${px}px`} className="object-cover" />
          </div>
        </div>
        <h2 className="font-[family-name:var(--font-album-serif)] text-3xl font-semibold text-zinc-800 sm:text-4xl dark:text-zinc-100">
          {label}
        </h2>
      </div>
    );
  }

  const medallionPx = MEDALLION_PX[decoration.size];
  return (
    <div
      className="flex h-full w-full flex-col items-center justify-center gap-4 overflow-hidden bg-[var(--cover-light)] px-6 text-center dark:bg-[var(--cover-dark)]"
      style={bgVars}
    >
      <div
        className="relative shrink-0 overflow-hidden rounded-full shadow-md shadow-black/10 ring-4 ring-white/60 dark:ring-white/10"
        style={{ width: medallionPx, height: medallionPx }}
      >
        <Image src={decoration.webPath} alt="" fill sizes={`${medallionPx}px`} className="object-cover" />
      </div>
      <span className="h-px w-10 bg-zinc-800/25 dark:bg-zinc-100/25" />
      <h2 className="font-[family-name:var(--font-album-serif)] text-4xl font-semibold text-zinc-800 sm:text-5xl dark:text-zinc-100">
        {label}
      </h2>
    </div>
  );
}
