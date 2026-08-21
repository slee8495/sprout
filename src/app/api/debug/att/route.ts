import { NextResponse } from "next/server";

// Temporary diagnostic route. The App Tracking Transparency prompt refuses to appear on a real
// device (two screen recordings for App Review caught nothing), and every plausible cause —
// plugin missing, method missing, iOS returning an already-decided status, the OS-level "Allow
// Apps to Request to Track" switch being off — looks identical from the outside: no dialog.
// requestTrackingConsent() posts what it actually saw here so `vercel logs` can tell them apart.
//
// Reports only what the AdMob plugin returns about tracking, no user or device identifiers.
// Not linked from anywhere in the UI; delete once the prompt is confirmed working.
export async function POST(request: Request) {
  const report = await request.json().catch(() => null);
  console.log("[att-debug]", JSON.stringify(report));
  return NextResponse.json({ ok: true });
}
