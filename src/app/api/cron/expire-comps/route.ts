import { NextResponse } from "next/server";
import { expireComplimentaryAccess } from "@/db/queries";

// Runs daily via Vercel Cron (see vercel.json). Downgrades complimentary Pro grants whose
// expiry date has passed back to Free — only ever touches families with no real Stripe
// subscription behind their "active" status, so it can never affect a real paying customer.
export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const expiredCount = await expireComplimentaryAccess();
  return NextResponse.json({ expired: expiredCount });
}
