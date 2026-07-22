import { NextResponse } from "next/server";
import { auth } from "@/auth";

const PUBLIC_PATHS = new Set(["/login", "/signup", "/join"]);

export default auth((req) => {
  const isLoggedIn = !!req.auth?.user;
  const isPublicPage = PUBLIC_PATHS.has(req.nextUrl.pathname);

  if (!isLoggedIn && !isPublicPage) {
    return NextResponse.redirect(new URL("/login", req.nextUrl));
  }
  if (isLoggedIn && isPublicPage) {
    return NextResponse.redirect(new URL("/", req.nextUrl));
  }
});

export const config = {
  matcher: [
    "/((?!api/auth|_next/static|_next/image|favicon.ico|manifest.webmanifest|icon$|icon-192|icon-512|apple-icon|sw.js).*)",
  ],
};
