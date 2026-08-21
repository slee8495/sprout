import type { NextRequest } from "next/server";
import { signIn } from "@/auth";

// Entry point for the native app's sign-in buttons: opened in the system browser and, on success,
// landing on /api/auth/mobile-callback to hand the session back to the app.
//
// Google is here because Google forbids OAuth inside an embedded WebView (see src/auth.ts).
// Apple is here for a different reason: Capacitor's iOS shell has no `server.allowNavigation`, so
// any navigation away from roun.sl-studio.dev — including to appleid.apple.com — gets handed to
// Safari. Sign-in would start in the app's WebView, where Auth.js writes its `state` cookie, and
// finish in Safari, which has a separate cookie jar and none of it: every attempt died on "state
// cookie was missing" (2026-08-21). Running the whole flow in the system browser keeps it in one
// cookie jar, and needs no new native build.
const PROVIDERS = new Set(["google", "apple"]);

export async function GET(request: NextRequest) {
  const requested = request.nextUrl.searchParams.get("provider");
  const provider = requested && PROVIDERS.has(requested) ? requested : "google";
  await signIn(provider, { redirectTo: "/api/auth/mobile-callback" });
}
