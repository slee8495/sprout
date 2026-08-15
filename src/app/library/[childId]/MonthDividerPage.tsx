import Image from "next/image";
import { decorationForMonth, type DecorativeSize } from "@/lib/decorativeIllustrations";
import { formatMonthLabel } from "@/lib/milestones";

const FRAME_PAD_PCT: Record<DecorativeSize, number> = { sm: 8, md: 5, lg: 2 };
const SIDE_WIDTH_PCT: Record<DecorativeSize, number> = { sm: 45, md: 52, lg: 60 };
const POSTER_PAD_PCT: Record<DecorativeSize, number> = { sm: 6, md: 3, lg: 0 };

// Tailwind needs this class written literally (not templated from a constant) to pick it up at
// build time — matches CollagePage.tsx's tile matting exactly, so the illustration's own
// background never seams against the page around it.
const MATTE = "bg-[#f2ece0] dark:bg-zinc-800";

// The AI-illustration disclosure lives once, up top on the album screen (AlbumView's header) —
// not repeated on every month divider page. Every page shares the exact same background (the same
// matte tone the photo collage tiles use) so there's never a color seam within a page, and every
// illustration is shown in full via object-contain — never cropped into the animal's face — and
// sized to dominate the page rather than sit small in a box. Only the layout, illustration size,
// and position vary per month (decorationForMonth).
export function MonthDividerPage({ date, monthIndex }: { date: string; monthIndex: number }) {
  const decoration = decorationForMonth(date.slice(0, 7), monthIndex);
  const label = formatMonthLabel(date);

  if (decoration.variant === "side") {
    const widthPct = SIDE_WIDTH_PCT[decoration.size];
    return (
      <div className={`flex h-full w-full items-stretch ${MATTE} ${decoration.flip ? "flex-row-reverse" : "flex-row"}`}>
        <div className="relative shrink-0" style={{ width: `${widthPct}%` }}>
          <Image src={decoration.webPath} alt="" fill sizes="600px" className="object-contain p-2" />
        </div>
        <div className="flex min-w-0 flex-1 flex-col items-center justify-center gap-3 px-2 text-center">
          <span className="h-px w-10 bg-zinc-800/25 dark:bg-zinc-100/25" />
          <h2 className="w-full break-words font-[family-name:var(--font-album-serif)] text-lg font-semibold text-zinc-800 sm:text-2xl dark:text-zinc-100">
            {label}
          </h2>
        </div>
      </div>
    );
  }

  if (decoration.variant === "poster") {
    const padPct = POSTER_PAD_PCT[decoration.size];
    return (
      <div className={`relative flex h-full w-full flex-col items-center justify-end ${MATTE}`} style={{ padding: `${padPct}%` }}>
        <div className="relative w-full flex-1">
          <Image src={decoration.webPath} alt="" fill sizes="800px" className="object-contain" />
        </div>
        <div
          className={`relative z-10 rounded-2xl bg-white/90 px-6 py-3 shadow-md dark:bg-zinc-900/85 ${decoration.flip ? "order-first mb-3" : "mt-3"}`}
        >
          <h2 className="font-[family-name:var(--font-album-serif)] text-3xl font-semibold text-zinc-800 sm:text-4xl dark:text-zinc-100">
            {label}
          </h2>
        </div>
      </div>
    );
  }

  const padPct = FRAME_PAD_PCT[decoration.size];
  return (
    <div className={`flex h-full w-full flex-col gap-3 ${MATTE}`} style={{ padding: `${padPct}%` }}>
      <div className="relative min-h-0 flex-1 rounded-lg bg-white p-3 shadow-md shadow-black/10 dark:bg-zinc-900">
        <Image src={decoration.webPath} alt="" fill sizes="800px" className="object-contain p-2" />
      </div>
      <h2 className="shrink-0 text-center font-[family-name:var(--font-album-serif)] text-2xl font-semibold text-zinc-800 sm:text-3xl dark:text-zinc-100">
        {label}
      </h2>
    </div>
  );
}
