import NextAuth from "next-auth";
import type { OAuth2Config } from "next-auth/providers";
import Apple from "next-auth/providers/apple";
import type { GoogleProfile } from "next-auth/providers/google";
import Credentials from "next-auth/providers/credentials";
import { getUserByEmail, getUserById } from "@/db/queries";
import { appleClientSecret, isAppleSignInConfigured } from "@/lib/appleClientSecret";
import { verifyMobileHandoffToken } from "@/lib/mobileAuth";

// Auth.js's built-in Google provider does OIDC discovery, and Google's discovery document
// advertises `authorization_response_iss_parameter_supported: true`. oauth4webapi then requires
// the callback's `iss` param to exactly match the discovered issuer, but next-auth@5.0.0-beta.31's
// OIDC id_token verification path has an unrelated compatibility issue with this beta of
// oauth4webapi. Configuring explicit endpoints (type: "oauth" instead of "oidc") skips discovery
// and id_token verification, fetching the profile from the userinfo endpoint with the access
// token instead — `issuer` must still be set explicitly so the `iss` param can be validated.
function GoogleProvider(): OAuth2Config<GoogleProfile> {
  return {
    id: "google",
    name: "Google",
    type: "oauth",
    clientId: process.env.AUTH_GOOGLE_ID,
    clientSecret: process.env.AUTH_GOOGLE_SECRET,
    issuer: "https://accounts.google.com",
    authorization: {
      url: "https://accounts.google.com/o/oauth2/v2/auth",
      // Without this, Google silently re-authenticates whichever Google account already has an
      // active session in the browser — after signing out of the app there's no way to switch
      // accounts, since the chooser never appears. Forces it to show every time.
      params: { scope: "openid email profile", prompt: "select_account" },
    },
    token: "https://oauth2.googleapis.com/token",
    userinfo: "https://openidconnect.googleapis.com/v1/userinfo",
    profile(profile) {
      return { id: profile.sub, name: profile.name, email: profile.email, image: profile.picture };
    },
  };
}

// Google disallows OAuth inside embedded WebViews (and even where it's not outright blocked,
// the app's WebView cookie jar is separate from the system browser's, so a session set there
// never reaches the app). For the native app, Google sign-in instead runs in the system browser
// (see /api/mobile-login) and hands off to the app via a signed one-time token + deep link (see
// /api/auth/mobile-callback) — this provider redeems that token for a normal session inside the
// app's own WebView.
const MobileHandoffProvider = Credentials({
  id: "mobile-handoff",
  name: "Mobile handoff",
  credentials: { token: { label: "Token", type: "text" } },
  async authorize(credentials) {
    const token = credentials?.token;
    if (typeof token !== "string") return null;
    const userId = await verifyMobileHandoffToken(token);
    if (!userId) return null;
    const dbUser = await getUserById(Number(userId));
    if (!dbUser) return null;
    return { id: String(dbUser.id), name: dbUser.name, email: dbUser.email, image: dbUser.imageUrl };
  },
});

// Guideline 4.8 requires any app offering a third-party login service to also offer one that
// collects no more than name and email and lets users keep that email private — App Review
// rejected build 1.3 (3) over Google-only sign-in on Aug 21 2026. Unlike Google, Apple permits
// its OAuth page inside an embedded WebView, so this same web flow works as-is in the native
// app; no system-browser handoff is needed (see the MobileHandoffProvider comment above).
//
// The config is a function because Apple's client secret is a JWT minted at runtime and so can
// only be awaited, not read straight out of the environment. Kept optional so local development
// and preview deployments without the Apple keys still boot.
export const { handlers, auth, signIn, signOut, unstable_update } = NextAuth(async () => ({
  providers: [
    GoogleProvider(),
    ...(isAppleSignInConfigured()
      ? [Apple({ clientId: process.env.AUTH_APPLE_ID, clientSecret: await appleClientSecret() })]
      : []),
    MobileHandoffProvider,
  ],
  session: { strategy: "jwt" as const },
  pages: { signIn: "/login" },
  // Without this, next-auth's host detection is inconsistent behind Vercel's proxy on some
  // requests, causing the PKCE/state cookies set during signin to mismatch what the callback
  // looks for (InvalidCheck: "pkceCodeVerifier value could not be parsed") — this only affects
  // first-time sign-ins because returning users skip Google's extra consent-screen redirect hop.
  trustHost: true,
  callbacks: {
    async jwt({ token, account, trigger }) {
      // Re-resolve the internal user/family from the DB whenever a new Google sign-in
      // happens (account present) or the client asks us to refresh (after linking a family).
      if (account || trigger === "update") {
        const dbUser = token.email ? await getUserByEmail(token.email) : undefined;
        token.id = dbUser ? String(dbUser.id) : undefined;
        token.familyId = dbUser?.familyId;
        token.role = dbUser?.role;
        token.tier = dbUser?.tier;
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = (token.id as string | undefined) ?? "";
        session.user.familyId = token.familyId as number | undefined;
        session.user.role = token.role as "owner" | "editor" | "viewer" | undefined;
        session.user.tier = token.tier as "inner" | "extended" | undefined;
      }
      return session;
    },
  },
}));
