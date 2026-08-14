"use client";

import { Capacitor } from "@capacitor/core";
import { Browser } from "@capacitor/browser";
import { T } from "../T";
import { loginWithGoogle } from "./actions";

// Native app: Google forbids OAuth inside an embedded WebView (and the app's WebView cookie jar
// is separate from the system browser's anyway), so sign-in opens in the system browser instead
// and hands the session back via a deep link — see /api/mobile-login and MobileAuthListener.
// Regular web: unchanged, a normal form post straight to the server action.
//
// This app loads its web build live from production (Capacitor "remote URL" pattern), so a
// deploy reaches every installed app instantly — but native plugins like Browser only exist in
// APKs built after they were added. isPluginAvailable() guards against JS calling a plugin an
// older, already-installed native shell doesn't have, falling back to the pre-existing in-app
// flow instead of throwing "plugin is not implemented".
export function GoogleSignInButton() {
  if (Capacitor.isNativePlatform() && Capacitor.isPluginAvailable("Browser")) {
    return (
      <button
        type="button"
        onClick={() =>
          // toolbarColor can't hide the address bar Google requires during OAuth, but matches it
          // to the app's brand color so the hand-off to the system browser feels less jarring.
          Browser.open({ url: "https://roun.sl-studio.dev/api/mobile-login", toolbarColor: "#059669" })
        }
        className="flex items-center justify-center gap-2 rounded-full bg-brand-600 px-4 py-2 font-heading font-semibold text-white shadow-sm shadow-brand-900/20 transition-transform hover:scale-105 hover:bg-brand-700 active:scale-95"
      >
        <T>Sign in with Google</T>
      </button>
    );
  }

  return (
    <form action={loginWithGoogle}>
      <button
        type="submit"
        className="flex w-full items-center justify-center gap-2 rounded-full bg-brand-600 px-4 py-2 font-heading font-semibold text-white shadow-sm shadow-brand-900/20 transition-transform hover:scale-105 hover:bg-brand-700 active:scale-95"
      >
        <T>Sign in with Google</T>
      </button>
    </form>
  );
}
