import type { CSSProperties } from "react";
import { illustrationForAnimal } from "@/lib/animalIllustrations";
import { coverBackgroundHex } from "@/lib/covers";
import { formatMonthLabel } from "@/lib/milestones";
import { CoverArt } from "../../CoverArt";
import { useSettings } from "../../SettingsProvider";

export function MonthDividerPage({
  date,
  coverBackground,
  coverAnimal,
}: {
  date: string;
  coverBackground: string | null;
  coverAnimal?: string | null;
}) {
  const { t } = useSettings();
  const hasIllustration = !!illustrationForAnimal(coverAnimal);
  return (
    <div
      className="relative flex h-full w-full flex-col items-center justify-center gap-4 overflow-hidden bg-[var(--cover-light)] px-6 text-center dark:bg-[var(--cover-dark)]"
      style={
        {
          "--cover-light": coverBackgroundHex(coverBackground, false),
          "--cover-dark": coverBackgroundHex(coverBackground, true),
        } as CSSProperties
      }
    >
      {hasIllustration && (
        <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-full shadow-md shadow-black/10 ring-4 ring-white/60 dark:ring-white/10">
          <CoverArt animal={coverAnimal} fallbackEmoji="" sizes="80px" />
        </div>
      )}
      <span className="h-px w-10 bg-zinc-800/25 dark:bg-zinc-100/25" />
      <h2 className="font-[family-name:var(--font-album-serif)] text-4xl font-semibold text-zinc-800 sm:text-5xl dark:text-zinc-100">
        {formatMonthLabel(date)}
      </h2>
      {hasIllustration && (
        <p className="absolute bottom-3 text-[9px] tracking-wide text-zinc-800/40 uppercase dark:text-zinc-100/40">
          {t("🎨 AI-generated illustration")}
        </p>
      )}
    </div>
  );
}
