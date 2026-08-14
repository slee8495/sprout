import { SignJWT, jwtVerify } from "jose";

// Short-lived handoff token used only to carry a signed-in user's identity from the system
// browser (where Google OAuth actually runs for the native app, per Google's WebView policy)
// back into the Capacitor app's own WebView via a custom-scheme deep link. See
// /api/auth/mobile-callback (mints) and the "mobile-handoff" Credentials provider (verifies).
const secret = () => new TextEncoder().encode(process.env.AUTH_SECRET);

export async function signMobileHandoffToken(userId: string) {
  return new SignJWT({ uid: userId })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("2m")
    .sign(secret());
}

export async function verifyMobileHandoffToken(token: string): Promise<string | null> {
  try {
    const { payload } = await jwtVerify(token, secret());
    return typeof payload.uid === "string" ? payload.uid : null;
  } catch {
    return null;
  }
}
