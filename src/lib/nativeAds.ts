"use client";

import { Capacitor } from "@capacitor/core";
import { AdMob, InterstitialAdPluginEvents } from "@capacitor-community/admob";
import { App } from "@capacitor/app";

const INTERSTITIAL_AD_UNIT_ID: Record<string, string> = {
  ios: "ca-app-pub-6676109773026277/8500721368",
  android: "ca-app-pub-6676109773026277/9813803034",
};

let initPromise: Promise<void> | null = null;

export function isNativeAdsAvailable(): boolean {
  return typeof window !== "undefined" && Capacitor.isNativePlatform() && Capacitor.getPlatform() in INTERSTITIAL_AD_UNIT_ID;
}

export function initNativeAds(): Promise<void> {
  if (!initPromise) initPromise = AdMob.initialize();
  return initPromise;
}

// Resolves once the interstitial has been shown and dismissed (or skipped because it
// couldn't be loaded/shown) — callers should proceed with their save either way, so this
// never rejects and always resolves within a few seconds even if the ad network hangs.
export async function showInterstitialAd(): Promise<void> {
  const adId = INTERSTITIAL_AD_UNIT_ID[Capacitor.getPlatform()];
  if (!adId) return;

  await new Promise<void>((resolve) => {
    let done = false;
    const finish = () => {
      if (done) return;
      done = true;
      clearTimeout(timeout);
      resolve();
    };
    const timeout = setTimeout(finish, 10000);

    Promise.all([
      AdMob.addListener(InterstitialAdPluginEvents.Dismissed, finish),
      AdMob.addListener(InterstitialAdPluginEvents.FailedToShow, finish),
    ]).catch(finish);

    initNativeAds()
      .then(() => AdMob.prepareInterstitial({ adId }))
      .then(() => AdMob.showInterstitial())
      .catch(finish);
  });
}

// Apple requires the App Tracking Transparency prompt to appear before anything that could be
// used to track the user is collected. AdMob's IDFA request is the only such collection here,
// and an interstitial only loads after 50 taps (see clickAdCounter.ts) — far past what a
// reviewer, or most users, ever reach — so initializing AdMob lazily meant the prompt in
// practice never appeared. App Review rejected build 1.3 (3) for exactly that (Guideline 2.1,
// Aug 21 2026). Ask once at launch instead, before AdMob is ever initialized.
export async function requestTrackingConsent(): Promise<void> {
  if (!isNativeAdsAvailable() || Capacitor.getPlatform() !== "ios") return;
  // This app loads its web build live from production (Capacitor "remote URL" pattern), so this
  // code also runs inside older installed shells that may predate the plugin — see the same
  // guard in GoogleSignInButton.tsx.
  if (!Capacitor.isPluginAvailable("AdMob")) return;

  await whenAppIsActive();

  try {
    // iOS only ever shows this dialog once per install; asking again after the user has answered
    // just reports the existing status instead of prompting, so there's no status check first —
    // one less plugin call that could throw and swallow the prompt with it.
    await AdMob.requestTrackingAuthorization();
  } catch {
    // Never let a failed consent prompt block the app from starting.
  }
}

// iOS silently ignores an ATT request unless the app is already foreground-active. At launch the
// WebView mounts while the app is still coming up, which is why the first screen recording for
// App Review caught no prompt at all on a fresh install.
async function whenAppIsActive(): Promise<void> {
  if (!Capacitor.isPluginAvailable("App")) return;

  const { isActive } = await App.getState();
  if (!isActive) {
    await new Promise<void>((resolve) => {
      const listener = App.addListener("appStateChange", (state) => {
        if (!state.isActive) return;
        void listener.then((l) => l.remove());
        resolve();
      });
    });
  }

  // Being active isn't quite enough on a cold start — give the launch transition a moment to
  // finish before putting a system dialog on top of it.
  await new Promise((resolve) => setTimeout(resolve, 800));
}
