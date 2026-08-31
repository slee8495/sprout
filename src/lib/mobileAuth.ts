import { SignJWT, jwtVerify } from "jose";

// Short-lived handoff token used only to carry a signed-in user's identity from the system
// browser (where Google OAuth actually runs for the native app, per Google's WebView policy)
// back into the Capacitor app's own WebView via a custom-scheme deep link. See
// /api/auth/mobile-callback (mints) and the "mobile-handoff" Credentials provider (verifies).
//
// It carries the email rather than a row id because at this point in a first-ever sign-in there
// is no row yet: `users` is written when a family is created or joined, which happens after this.
// Keying the handoff on the id meant every brand-new account — including every App Review pass,
// since reviewers always sign up fresh — fell out of the flow here and finished onboarding in the
// browser, leaving the app itself signed out.
const secret = () => new TextEncoder().encode(process.env.AUTH_SECRET);

export type MobileHandoff = { email: string; name?: string };

export async function signMobileHandoffToken(identity: MobileHandoff) {
  return new SignJWT({ email: identity.email, name: identity.name })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("2m")
    .sign(secret());
}

export async function verifyMobileHandoffToken(token: string): Promise<MobileHandoff | null> {
  try {
    const { payload } = await jwtVerify(token, secret());
    if (typeof payload.email !== "string" || !payload.email) return null;
    return { email: payload.email, name: typeof payload.name === "string" ? payload.name : undefined };
  } catch {
    return null;
  }
}
