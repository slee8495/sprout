import { NextResponse } from "next/server";
import type { NextFetchEvent, NextRequest } from "next/server";
import { auth } from "@/auth";

// Reachable once signed in but before a family is linked yet.
const FAMILY_SETUP_PATHS = new Set(["/connect", "/signup", "/join"]);

// Legal pages, the install guide, and support: always public, regardless of auth state. Support
// especially — it's the App Store's Support URL, so it has to work for someone with no account.
const PUBLIC_PATHS = new Set(["/privacy", "/terms", "/account-deletion", "/get-app", "/support"]);

const withAuth = auth((req) => {
  const isLoggedIn = !!req.auth?.user;
  const hasFamily = !!req.auth?.user?.familyId;
  const { pathname } = req.nextUrl;

  if (PUBLIC_PATHS.has(pathname)) return;

  if (pathname === "/login") {
    if (isLoggedIn) return NextResponse.redirect(new URL(hasFamily ? "/" : "/connect", req.nextUrl));
    return;
  }

  if (FAMILY_SETUP_PATHS.has(pathname)) {
    if (!isLoggedIn) return NextResponse.redirect(new URL("/login", req.nextUrl));
    if (hasFamily) return NextResponse.redirect(new URL("/", req.nextUrl));
    return;
  }

  // "/" is public — logged-out visitors see the marketing landing page (page.tsx renders
  // it directly), logged-in ones see their journal. Only the family-linking redirect applies.
  if (pathname === "/") {
    if (isLoggedIn && !hasFamily) return NextResponse.redirect(new URL("/connect", req.nextUrl));
    return;
  }

  if (!isLoggedIn) return NextResponse.redirect(new URL("/login", req.nextUrl));
  if (!hasFamily) return NextResponse.redirect(new URL("/connect", req.nextUrl));
});

// src/auth.ts builds its config with an async function (Apple's client secret has to be minted at
// runtime), and in that mode next-auth's `auth()` wrapper resolves to the middleware rather than
// being it — its type says otherwise, hence the await on a value TypeScript thinks is already a
// function. Awaiting is harmless either way, so this keeps working if the config ever goes back to
// a plain object. Next requires this file's default export to be a function, so it can't just be
// `export default auth(...)` anymore.
export default async function proxy(req: NextRequest, event: NextFetchEvent) {
  // next-auth's overloads resolve this to its route-handler form, whose second parameter is a
  // route context; at runtime it's the middleware form, which gets the fetch event. Either way the
  // callback above only ever reads `req`, so what's passed through here is never looked at.
  return (await withAuth)(req, event as unknown as Parameters<typeof withAuth>[1]);
}

export const config = {
  matcher: [
    // `.well-known` covers Apple's domain-association file, which Apple fetches unauthenticated
    // when verifying the Sign in with Apple Services ID — without this it would be answered with
    // a redirect to /login and verification would fail.
    "/((?!api/auth|api/mobile-login|api/debug|api/stripe/webhook|api/cron|_next/static|_next/image|\\.well-known|favicon.ico|manifest.webmanifest|icon\\.png|icon-192|icon-512|apple-icon|sw.js).*)",
  ],
};
