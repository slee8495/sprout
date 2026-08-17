import { NextResponse } from "next/server";
import { auth } from "@/auth";

// Reachable once signed in with Google but before a family is linked yet.
const FAMILY_SETUP_PATHS = new Set(["/connect", "/signup", "/join"]);

// Legal pages, plus the install guide: always public, regardless of auth state.
const PUBLIC_PATHS = new Set(["/privacy", "/terms", "/account-deletion", "/get-app"]);

export default auth((req) => {
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

export const config = {
  matcher: [
    "/((?!api/auth|api/mobile-login|api/debug|api/stripe/webhook|api/cron|_next/static|_next/image|favicon.ico|manifest.webmanifest|icon\\.png|icon-192|icon-512|apple-icon|sw.js).*)",
  ],
};
