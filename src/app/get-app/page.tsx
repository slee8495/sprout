"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

type Platform = "ios" | "android" | "other";

// Live since 2026-09-07. No /us/ storefront segment on purpose: Apple redirects each visitor
// to their own country's store, and Roun ships in 5 languages.
const APP_STORE_URL =
  "https://apps.apple.com/app/roun-journal-photo-album/id6802521881";

function detectPlatform(): Platform {
  if (typeof navigator === "undefined") return "other";
  const ua = navigator.userAgent;
  if (/iPad|iPhone|iPod/.test(ua) && !("MSStream" in window)) return "ios";
  // iPadOS 13+ reports a desktop Safari user agent, so the test above misses every modern
  // iPad. Touch points are the only reliable tell — no Mac reports more than one.
  if (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1) return "ios";
  if (/Android/.test(ua)) return "android";
  return "other";
}

// Fired by Chrome/Android when the page qualifies as an installable PWA — capturing it lets us
// trigger the real native install prompt from our own button instead of just linking to nothing.
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const MenuDotsIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="h-6 w-6 shrink-0">
    <circle cx="12" cy="5" r="1.8" />
    <circle cx="12" cy="12" r="1.8" />
    <circle cx="12" cy="19" r="1.8" />
  </svg>
);

function Step({ number, icon, children }: { number: number; icon?: React.ReactNode; children: React.ReactNode }) {
  return (
    <li className="flex items-start gap-3">
      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand-600 font-heading text-sm font-bold text-white">
        {number}
      </span>
      <span className="flex flex-1 items-center gap-2 pt-0.5 text-sm text-zinc-700 dark:text-zinc-300">
        {icon}
        {children}
      </span>
    </li>
  );
}

export default function GetAppPage() {
  const [platform, setPlatform] = useState<Platform>("other");
  const [installEvent, setInstallEvent] = useState<BeforeInstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    setPlatform(detectPlatform());

    function onBeforeInstallPrompt(e: Event) {
      e.preventDefault();
      setInstallEvent(e as BeforeInstallPromptEvent);
    }
    function onAppInstalled() {
      setInstalled(true);
      setInstallEvent(null);
    }
    window.addEventListener("beforeinstallprompt", onBeforeInstallPrompt);
    window.addEventListener("appinstalled", onAppInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstallPrompt);
      window.removeEventListener("appinstalled", onAppInstalled);
    };
  }, []);

  async function handleInstallClick() {
    if (!installEvent) return;
    await installEvent.prompt();
    const { outcome } = await installEvent.userChoice;
    if (outcome === "accepted") setInstalled(true);
    setInstallEvent(null);
  }

  return (
    <div className="mx-auto flex w-full max-w-md flex-1 flex-col items-center gap-6 p-6 pb-16 text-center">
      <Image src="/icon-512.png" alt="Roun" width={88} height={88} priority className="rounded-[22px] shadow-lg shadow-brand-900/20" />
      <div>
        <h1 className="font-heading text-2xl font-bold text-brand-700 dark:text-brand-300">Get Roun on your phone</h1>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          {platform === "ios"
            ? "Download it from the App Store — it takes a few seconds."
            : "Add it to your home screen — it opens and feels just like an app."}
        </p>
      </div>

      {platform === "android" && (
        <section className="w-full rounded-3xl border border-brand-200/70 bg-white p-5 text-left dark:border-brand-800/50 dark:bg-zinc-900">
          <h2 className="mb-3 font-heading text-sm font-bold text-brand-800 dark:text-brand-200">📲 Android</h2>
          {installed ? (
            <p className="text-sm text-emerald-700 dark:text-emerald-400">✅ Installed! Check your home screen.</p>
          ) : installEvent ? (
            <button
              type="button"
              onClick={handleInstallClick}
              className="w-full rounded-full bg-brand-600 px-4 py-3 font-heading text-sm font-semibold text-white shadow-sm shadow-brand-900/20 transition-transform hover:scale-105 active:scale-95"
            >
              Install Roun
            </button>
          ) : (
            <ol className="flex flex-col gap-3">
              <Step number={1} icon={<MenuDotsIcon />}>
                Tap the <strong>⋮ menu</strong> in Chrome (top right)
              </Step>
              <Step number={2}>Tap "Add to Home screen" or "Install app"</Step>
              <Step number={3}>Confirm — Roun appears on your home screen</Step>
            </ol>
          )}
        </section>
      )}

      {platform === "ios" && (
        <section className="w-full rounded-3xl border border-brand-200/70 bg-white p-5 text-left dark:border-brand-800/50 dark:bg-zinc-900">
          <h2 className="mb-3 font-heading text-sm font-bold text-brand-800 dark:text-brand-200">🍎 iPhone / iPad</h2>
          <a
            href={APP_STORE_URL}
            className="block w-full rounded-full bg-brand-600 px-4 py-3 text-center font-heading text-sm font-semibold text-white shadow-sm shadow-brand-900/20 transition-transform hover:scale-105 active:scale-95"
          >
            Download on the App Store
          </a>
          <p className="mt-3 text-xs text-zinc-500 dark:text-zinc-400">
            The real app, straight from the App Store — no home screen setup needed.
          </p>
        </section>
      )}

      {platform === "other" && (
        <section className="w-full rounded-3xl border border-brand-200/70 bg-white p-5 text-sm text-zinc-600 dark:border-brand-800/50 dark:bg-zinc-900 dark:text-zinc-400">
          Open <strong>sl-studio.dev/roun</strong> on your phone to install Roun.
        </section>
      )}

      {platform !== "other" && (
        <button
          type="button"
          onClick={() => setPlatform(platform === "ios" ? "android" : "ios")}
          className="text-xs font-semibold text-brand-700 underline dark:text-brand-300"
        >
          {platform === "ios" ? "I'm on Android instead" : "I'm on iPhone instead"}
        </button>
      )}

      <a href="/settings" className="text-xs text-zinc-400 underline dark:text-zinc-500">
        Or continue in your browser
      </a>

      <p className="mt-2 text-xs text-zinc-400 dark:text-zinc-500">
        📱 Google Play version, coming soon.
      </p>
    </div>
  );
}
