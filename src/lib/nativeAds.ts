"use client";

import { Capacitor } from "@capacitor/core";
import { AdMob, InterstitialAdPluginEvents } from "@capacitor-community/admob";

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
