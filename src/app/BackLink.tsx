"use client";

import { useRouter } from "next/navigation";

/**
 * A way off the pages that NavBar hides itself on (/terms, /privacy). Inside the native app those
 * pages have no navigation at all, so a visitor who follows the Terms link from the purchase screen
 * has nothing to tap to get back — the app looks like it has swallowed them.
 *
 * Prefers going back so the reader returns to wherever they came from — Settings, the landing page,
 * the other legal page. Only a direct load with no history to pop falls through to the home page.
 */
export function BackLink() {
  const router = useRouter();

  return (
    <button
      type="button"
      onClick={() => (window.history.length > 1 ? router.back() : router.push("/"))}
      className="font-heading text-sm font-semibold text-brand-700 underline dark:text-brand-300"
    >
      ← Back
    </button>
  );
}
