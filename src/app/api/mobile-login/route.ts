import { signIn } from "@/auth";

// Entry point for the native app's "Sign in with Google" button: opened in the system browser
// (never the app's own WebView — see src/auth.ts for why), it starts the normal Google OAuth
// flow and, on success, lands on /api/auth/mobile-callback to hand the session back to the app.
export async function GET() {
  await signIn("google", { redirectTo: "/api/auth/mobile-callback" });
}
