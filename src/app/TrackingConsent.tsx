"use client";

import { useEffect } from "react";
import { requestTrackingConsent } from "@/lib/nativeAds";

// Mounted once at the root. Fires the iOS App Tracking Transparency prompt on first launch,
// before any ad — and therefore any IDFA read — can happen. See src/lib/nativeAds.ts for why
// this can't wait until an interstitial is about to show.
export function TrackingConsent() {
  useEffect(() => {
    void requestTrackingConsent();
  }, []);

  return null;
}
