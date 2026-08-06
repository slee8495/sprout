import Link from "next/link";
import { T } from "./T";

const FEATURES: { emoji: string; title: string; body: string }[] = [
  {
    emoji: "📸",
    title: "Photos & voice memos",
    body: "Capture more than words — attach a photo or a quick voice memo to any entry.",
  },
  {
    emoji: "🎉",
    title: "Milestones",
    body: "Track firsts, big and small, and revisit them on “On this day.”",
  },
  {
    emoji: "🔒",
    title: "Private by default",
    body: "Only the family members you invite can ever see your journal.",
  },
  {
    emoji: "🌐",
    title: "5 languages",
    body: "Switch the app's language anytime from Settings.",
  },
];

export function LandingPage() {
  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-10 p-6 pb-16">
      <section className="flex flex-col items-center gap-4 pt-12 text-center">
        <h1 className="font-heading text-4xl font-bold text-emerald-700 dark:text-emerald-300">🌱 Sprout</h1>
        <p className="max-w-sm text-lg text-zinc-600 dark:text-zinc-400">
          <T>A private, lifelong journal for your family.</T>
        </p>
        <Link
          href="/login"
          className="mt-2 rounded-full bg-emerald-600 px-6 py-3 font-heading font-semibold text-white shadow-sm shadow-emerald-900/20 transition-transform hover:scale-105 hover:bg-emerald-700 active:scale-95"
        >
          <T>Get started</T>
        </Link>
      </section>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {FEATURES.map((feature) => (
          <div
            key={feature.title}
            className="flex flex-col gap-2 rounded-3xl border border-emerald-200/70 bg-white p-5 shadow-md shadow-emerald-900/5 dark:border-emerald-800/50 dark:bg-zinc-900 dark:shadow-black/40"
          >
            <span className="text-2xl">{feature.emoji}</span>
            <h2 className="font-heading font-semibold text-emerald-800 dark:text-emerald-200">
              <T>{feature.title}</T>
            </h2>
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              <T>{feature.body}</T>
            </p>
          </div>
        ))}
      </section>

      <p className="text-center text-xs text-zinc-500 dark:text-zinc-400">
        <Link href="/terms" className="underline">
          <T>Terms</T>
        </Link>{" "}
        <T>and</T>{" "}
        <Link href="/privacy" className="underline">
          <T>Privacy Policy</T>
        </Link>
      </p>
    </main>
  );
}
