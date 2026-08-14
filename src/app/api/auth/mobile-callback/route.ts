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
// silently dead-end with the browser just sitting on this page. Deliberately no JS auto-redirect
// attempt either — that was an extra, unreliable moving part; a real user tap on the button below
// is what actually, consistently triggers Android/iOS's app-link resolution.
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.redirect(new URL("/login", "https://roun.sl-studio.dev"));
  }
  const token = await signMobileHandoffToken(session.user.id);
  const deepLink = `dev.slstudio.sprout://mobile-auth?token=${encodeURIComponent(token)}`;
  const html = `<!doctype html>
<html><head><meta name="viewport" content="width=device-width, initial-scale=1" />
<style>
  body { font-family: system-ui, sans-serif; background: #FBF3DE; color: #3f2f1c; display: flex;
    flex-direction: column; align-items: center; justify-content: center; height: 100vh; margin: 0; gap: 16px; text-align: center; padding: 24px; }
  p { font-weight: 700; font-size: 18px; }
  a { display: inline-block; background: #059669; color: white; text-decoration: none; font-weight: 700;
    padding: 14px 28px; border-radius: 999px; font-size: 17px; }
</style></head>
<body>
  <p>✅ Signed in to Roun</p>
  <a href="${deepLink}">Return to the app</a>
</body></html>`;
  return new Response(html, { headers: { "Content-Type": "text/html; charset=utf-8" } });
}
