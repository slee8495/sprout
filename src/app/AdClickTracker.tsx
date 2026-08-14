"use client";

import { useEffect } from "react";
import { registerClick } from "@/lib/clickAdCounter";

// Mounted once at the root — counts every tap anywhere in the app toward the
// interstitial-ad frequency cap (see src/lib/clickAdCounter.ts).
export function AdClickTracker() {
  useEffect(() => {
    const onClick = () => {
      registerClick();
    };
    document.addEventListener("click", onClick, { capture: true });
    return () => document.removeEventListener("click", onClick, { capture: true });
  }, []);

  return null;
}
