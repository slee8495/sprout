import NextAuth from "next-auth";
import type { OAuth2Config } from "next-auth/providers";
import type { GoogleProfile } from "next-auth/providers/google";
import { getUserByEmail } from "@/db/queries";

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
      params: { scope: "openid email profile" },
    },
    token: "https://oauth2.googleapis.com/token",
    userinfo: "https://openidconnect.googleapis.com/v1/userinfo",
    profile(profile) {
      return { id: profile.sub, name: profile.name, email: profile.email, image: profile.picture };
    },
  };
}

export const { handlers, auth, signIn, signOut, unstable_update } = NextAuth({
  providers: [GoogleProvider()],
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  callbacks: {
    async jwt({ token, account, trigger }) {
      // Re-resolve the internal user/family from the DB whenever a new Google sign-in
      // happens (account present) or the client asks us to refresh (after linking a family).
      if (account || trigger === "update") {
        const dbUser = token.email ? await getUserByEmail(token.email) : undefined;
        token.id = dbUser ? String(dbUser.id) : undefined;
        token.familyId = dbUser?.familyId;
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = (token.id as string | undefined) ?? "";
        session.user.familyId = token.familyId as number | undefined;
      }
      return session;
    },
  },
});
