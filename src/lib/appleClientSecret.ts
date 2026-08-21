import { SignJWT, importPKCS8 } from "jose";

// Apple is the one provider that doesn't hand out a static client secret: it expects a short-lived
// ES256 JWT signed with a private key (.p8) downloaded from the developer portal, and caps its
// lifetime at 6 months. Minting it here at runtime rather than pasting a pre-generated
// AUTH_APPLE_SECRET into the environment means sign-in can't silently break months from now when
// a hand-made token quietly expires.
//
// AUTH_APPLE_ID       Services ID (e.g. dev.slstudio.sprout.web) — NOT the app's bundle ID
// AUTH_APPLE_TEAM_ID  10-character team ID (DX4YLNP9RK)
// AUTH_APPLE_KEY_ID   10-character key ID shown when the .p8 was created
// AUTH_APPLE_KEY      contents of the .p8, newlines either real or escaped as \n

export function isAppleSignInConfigured(): boolean {
  return Boolean(
    process.env.AUTH_APPLE_ID &&
      process.env.AUTH_APPLE_TEAM_ID &&
      process.env.AUTH_APPLE_KEY_ID &&
      process.env.AUTH_APPLE_KEY,
  );
}

let cached: Promise<string> | undefined;

export function appleClientSecret(): Promise<string> {
  // Only hold onto the promise once it resolves — caching a rejected one would poison every
  // later sign-in attempt for the lifetime of the serverless instance.
  cached ??= mint().catch((error) => {
    cached = undefined;
    throw error;
  });
  return cached;
}

async function mint(): Promise<string> {
  const { AUTH_APPLE_ID, AUTH_APPLE_TEAM_ID, AUTH_APPLE_KEY_ID, AUTH_APPLE_KEY } = process.env;
  if (!AUTH_APPLE_ID || !AUTH_APPLE_TEAM_ID || !AUTH_APPLE_KEY_ID || !AUTH_APPLE_KEY) {
    throw new Error("Sign in with Apple is missing one of AUTH_APPLE_ID/TEAM_ID/KEY_ID/KEY");
  }

  // Vercel's env UI keeps real newlines, but a .env.local line can only carry escaped ones.
  const key = await importPKCS8(AUTH_APPLE_KEY.replace(/\\n/g, "\n"), "ES256");

  return new SignJWT({})
    .setProtectedHeader({ alg: "ES256", kid: AUTH_APPLE_KEY_ID })
    .setIssuer(AUTH_APPLE_TEAM_ID)
    .setIssuedAt()
    // Comfortably under Apple's 6-month ceiling, and far longer than any instance lives.
    .setExpirationTime("120d")
    .setAudience("https://appleid.apple.com")
    .setSubject(AUTH_APPLE_ID)
    .sign(key);
}
