import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { signMobileHandoffToken } from "@/lib/mobileAuth";

// Reached in the system browser right after a successful Google sign-in triggered from the
// native app (/api/mobile-login). Mints a short-lived handoff token and sends the browser to the
// app's custom URL scheme so the app can redeem it for a session in its own WebView.
//
// This renders a small HTML page instead of issuing a bare HTTP redirect to the custom scheme:
// browsers (Chrome in particular) don't reliably follow a `Location:` header pointing at a
// non-http(s) scheme when there was no user gesture on this exact navigation, so the visit can
// silently dead-end with the browser just sitting on this page.
//
// A scripted hop into the scheme is attempted first anyway, with the button as the fallback that
// always works: App Review rejected build 1.3 (3) reporting the app "did not load" after Google
// sign-in on iPad (Guideline 2.1(a), Aug 21 2026), and a page offering nothing but a button is
// easy to read as a dead end rather than as a step to take. The scripted hop was previously
// dropped for being unreliable on its own — it is only ever a shortcut here, never the mechanism.
export async function GET() {
  const session = await auth();
  // Deliberately keyed on the email, not `user.id`: a first-ever sign-in has no `users` row yet
  // (one is written when a family is created or joined, which happens after this), so requiring an
  // id sent every new account back to /login — and from there the proxy walked them into onboarding
  // in the browser, with the app still signed out behind it.
  if (!session?.user?.email) {
    return NextResponse.redirect(new URL("/login", "https://roun.sl-studio.dev"));
  }
  const token = await signMobileHandoffToken({
    email: session.user.email,
    name: session.user.name ?? undefined,
  });
  const deepLink = `dev.slstudio.sprout://mobile-auth?token=${encodeURIComponent(token)}`;
  const html = `<!doctype html>
<html><head><meta name="viewport" content="width=device-width, initial-scale=1" />
<style>
  body { font-family: system-ui, sans-serif; background: #FBF3DE; color: #3f2f1c; display: flex;
    flex-direction: column; align-items: center; justify-content: center; height: 100vh; margin: 0; gap: 16px; text-align: center; padding: 24px; }
  p { font-weight: 700; font-size: 18px; }
  small { color: #6b5844; font-size: 14px; }
  a { display: inline-block; background: #059669; color: white; text-decoration: none; font-weight: 700;
    padding: 14px 28px; border-radius: 999px; font-size: 17px; }
</style></head>
<body>
  <p>✅ Signed in to Roun</p>
  <a id="return" href="${deepLink}">Return to the app</a>
  <small>If Roun doesn't open by itself, tap the button above.</small>
  <script>
    // Give the page a beat to paint first, so the button is already on screen if the OS ignores
    // this navigation — otherwise a failed hop leaves a blank-looking browser tab.
    setTimeout(function () { window.location.href = ${JSON.stringify(deepLink)}; }, 250);
  </script>
</body></html>`;
  return new Response(html, { headers: { "Content-Type": "text/html; charset=utf-8" } });
}
