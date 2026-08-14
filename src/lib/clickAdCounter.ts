"use client";

import { Preferences } from "@capacitor/preferences";
import { checkClickAd } from "@/app/actions";
import { isNativeAdsAvailable, showInterstitialAd } from "./nativeAds";

const CLICK_AD_INTERVAL = 50;
const STORAGE_KEY = "adClickCount";

let pending = false;

// Persisted on-device (survives app close/reopen) so a burst of taps across many sessions
// still adds up to the same threshold — closing the app can't be used to dodge the count.
export async function registerClick() {
  if (!isNativeAdsAvailable() || pending) return;

  const { value } = await Preferences.get({ key: STORAGE_KEY });
  const count = (Number(value) || 0) + 1;

  if (count < CLICK_AD_INTERVAL) {
    await Preferences.set({ key: STORAGE_KEY, value: String(count) });
    return;
  }

  pending = true;
  try {
    await Preferences.set({ key: STORAGE_KEY, value: "0" });
    const shouldShow = await checkClickAd().catch(() => false);
    if (shouldShow) await showInterstitialAd();
  } finally {
    pending = false;
  }
}
