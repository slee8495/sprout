"use client";

import Image from "next/image";
import { illustrationForAnimal } from "@/lib/animalIllustrations";

// Fills the parent element (which must be `relative`-positioned) with either the hand-picked
// illustration for this animal, or the plain emoji as a centered fallback — same fallback as
// before this existed. Used anywhere a cover animal shows up: library cards, the album header,
// the cover picker, month divider pages.
export function CoverArt({
  animal,
  fallbackEmoji,
  emojiClassName,
  sizes,
}: {
  animal: string | null | undefined;
  fallbackEmoji: string;
  emojiClassName?: string;
  sizes?: string;
}) {
  const illustration = illustrationForAnimal(animal);
  if (illustration) {
    return <Image src={illustration} alt="" fill sizes={sizes ?? "200px"} className="object-cover" />;
  }
  return <span className={emojiClassName}>{animal || fallbackEmoji}</span>;
}
