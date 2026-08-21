"use client";

import { Browser } from "@capacitor/browser";
import { Capacitor } from "@capacitor/core";
import { T } from "../T";

// Native app: Capacitor's iOS shell sets no `server.allowNavigation`, so the moment sign-in leaves
// roun.sl-studio.dev for appleid.apple.com the WebView hands the page to Safari. Sign-in would
// begin in the app's cookie jar, where Auth.js writes its `state` cookie, and end in Safari's,
// which has none of it — the callback then fails with "state cookie was missing" (2026-08-21).
// So run the whole flow in the system browser from the start, exactly as Google already does, and
// come back through the same deep-link handoff (see /api/mobile-login and MobileAuthListener).
// That keeps one cookie jar throughout and needs no new native build.
//
// Regular web: submit a real form to Auth.js's own route handler. A top-level navigation is the
// context browsers treat most permissively for the cookies this flow depends on — see
// ../../api/auth/signin/apple/route.ts, which also relaxes their SameSite flag.
//
// Black-on-white with the Apple mark is the presentation Apple's Sign in with Apple guidelines
// ask for.
async function startAppleSignIn() {
  // The native shells that predate the Browser plugin fall back to the in-app flow rather than
  // throwing "plugin is not implemented" — same guard as GoogleSignInButton.tsx.
  if (Capacitor.isNativePlatform() && Capacitor.isPluginAvailable("Browser")) {
    await Browser.open({
      url: "https://roun.sl-studio.dev/api/mobile-login?provider=apple",
      toolbarColor: "#000000",
    });
    return;
  }

  // Requesting the token is also what sets the CSRF cookie the sign-in route checks against.
  const { csrfToken } = await fetch("/api/auth/csrf").then((response) => response.json());

  const form = document.createElement("form");
  form.method = "POST";
  form.action = "/api/auth/signin/apple";
  form.hidden = true;
  for (const [name, value] of Object.entries({ csrfToken, callbackUrl: "/" })) {
    const field = document.createElement("input");
    field.type = "hidden";
    field.name = name;
    field.value = value;
    form.appendChild(field);
  }
  document.body.appendChild(form);
  form.submit();
}

export function AppleSignInButton() {
  return (
    <button
      type="button"
      onClick={() => {
        void startAppleSignIn();
      }}
      className="flex w-full items-center justify-center gap-2 rounded-full bg-black px-4 py-2 font-heading font-semibold text-white shadow-sm shadow-black/20 transition-transform hover:scale-105 hover:bg-zinc-800 active:scale-95 dark:bg-white dark:text-black dark:hover:bg-zinc-200"
    >
      <svg viewBox="0 0 384 512" className="h-4 w-4" fill="currentColor" aria-hidden="true">
        <path d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C63.3 141.2 4 184.8 4 273.5q0 39.3 14.4 81.2c12.8 36.7 59 126.7 107.2 125.2 25.2-.6 43-17.9 75.8-17.9 31.8 0 48.3 17.9 76.4 17.9 48.6-.7 90.4-82.5 102.6-119.3-65.2-30.7-61.7-90-61.7-91.9zm-56.6-164.2c27.3-32.4 24.8-61.9 24-72.5-24.1 1.4-52 16.4-67.9 34.9-17.5 19.8-27.8 44.3-25.6 71.9 26.1 2 49.9-11.4 69.5-34.3z" />
      </svg>
      <T>Sign in with Apple</T>
    </button>
  );
}
