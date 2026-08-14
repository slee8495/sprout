"use client";

import { useEffect } from "react";
import { App } from "@capacitor/app";
import { Browser } from "@capacitor/browser";
import { Capacitor } from "@capacitor/core";
import { signIn } from "next-auth/react";

// Mounted once at the root. Google sign-in for the native app runs in the system browser (see
// src/auth.ts for why) and, on success, redirects to this app's custom URL scheme carrying a
// short-lived handoff token. This listens for that deep link and redeems the token for a real
// session inside the app's own WebView via the "mobile-handoff" credentials provider.
export function MobileAuthListener() {
  useEffect(() => {
    // This app loads its web build live from production (Capacitor "remote URL" pattern), so a
    // deploy reaches every installed app instantly — but the "App" plugin only exists in APKs
    // built after it was added. Skip wiring the listener on older, already-installed shells
    // instead of throwing "plugin is not implemented".
    if (!Capacitor.isNativePlatform() || !Capacitor.isPluginAvailable("App")) return;

    const listener = App.addListener("appUrlOpen", ({ url }) => {
      const token = new URL(url).searchParams.get("token");
      if (!token) return;
      // The OS switching to the app on a custom-scheme redirect doesn't reliably dismiss the
      // system browser tab that sent it (it can linger on top, looking like a stuck webpage) —
      // close it explicitly instead of assuming the handoff already took care of it.
      void Browser.close().catch(() => {});
      void signIn("mobile-handoff", { token, redirectTo: "/" });
    });

    return () => {
      void listener.then((l) => l.remove());
    };
  }, []);

  return null;
}
