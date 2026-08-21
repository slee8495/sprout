import type { NextRequest } from "next/server";
import { handlers } from "@/auth";

// Sign in with Apple is the one provider that answers with `response_mode=form_post`: Apple sends
// the user's browser to this URL as a **cross-site POST**. Auth.js marks its `state` and `nonce`
// cookies `SameSite=None` for exactly that reason, but Safari — the browser every iOS user and
// every App Review device is on — does not reliably hand those cookies to a cross-site POST, and
// Auth.js then rejects the callback with "InvalidCheck: state value could not be parsed". That is
// what happened on the first real attempt (2026-08-21).
//
// So take Apple's POST here without needing any cookie, and re-submit the identical form to this
// same URL from this origin. The second POST is same-site, every browser sends the cookies, and it
// is handed straight to Auth.js. `redirect_uri` never changes — Auth.js sends the configured
// callback URL during the token exchange, not the URL this request arrived on — so Apple's
// registered Return URL stays exactly as it is.
//
// This route only shadows the [...nextauth] catch-all for this one path; a static segment wins
// over a catch-all, and GET is passed through untouched.

// The values below come from Apple, but they land in an HTML attribute, so treat them as untrusted.
function escapeAttribute(value: string) {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

export const GET = handlers.GET;

export async function POST(request: NextRequest) {
  // Always bounce once, never twice. Bouncing only when the `state` cookie looked missing wasn't
  // enough: `state` is SameSite=None and does arrive, but Auth.js's `callbackUrl` cookie is
  // SameSite=Lax and doesn't, so sign-in silently landed on "/" instead of the redirectTo the
  // flow asked for — which in the native app meant never handing back to the app at all.
  if (new URL(request.url).searchParams.has("bounced")) return handlers.POST(request);

  const form = await request.formData();
  const fields = [...form.entries()]
    .filter(([, value]) => typeof value === "string")
    .map(
      ([name, value]) =>
        `<input type="hidden" name="${escapeAttribute(name)}" value="${escapeAttribute(String(value))}" />`,
    )
    .join("");

  const html = `<!doctype html>
<html><head><meta name="viewport" content="width=device-width, initial-scale=1" />
<style>
  body { font-family: system-ui, sans-serif; background: #FBF3DE; color: #3f2f1c; display: flex;
    align-items: center; justify-content: center; height: 100vh; margin: 0; font-weight: 700; }
</style></head>
<body>
  <p>Signing you in…</p>
  <form id="f" method="POST" action="/api/auth/callback/apple?bounced=1">${fields}</form>
  <script>document.getElementById("f").submit();</script>
  <noscript><p>JavaScript is required to finish signing in.</p></noscript>
</body></html>`;

  return new Response(html, {
    headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" },
  });
}
