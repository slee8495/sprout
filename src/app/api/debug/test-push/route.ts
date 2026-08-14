import { NextResponse } from "next/server";
import webpush from "web-push";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { pushSubscriptions } from "@/db/schema";

// Temporary diagnostic route — sends one real test push to a given user's stored subscription(s)
// and reports back exactly what web-push says, instead of the silent failure notifyFamily() had
// before. Not linked from anywhere in the UI; remove once the real push notification bug is found.
export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = Number(new URL(request.url).searchParams.get("userId"));
  if (!userId) return NextResponse.json({ error: "Missing userId" }, { status: 400 });

  const vapidPublicKey = process.env.VAPID_PUBLIC_KEY;
  const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;
  const vapidSubject = process.env.VAPID_SUBJECT;
  if (!vapidPublicKey || !vapidPrivateKey || !vapidSubject) {
    return NextResponse.json({ error: "Missing VAPID env vars", vapidSubject: vapidSubject ?? null });
  }
  webpush.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey);

  const subs = await db.query.pushSubscriptions.findMany({ where: and(eq(pushSubscriptions.userId, userId)) });

  const results = await Promise.all(
    subs.map(async (sub) => {
      try {
        const res = await webpush.sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
          JSON.stringify({ title: "🧪 Test push", body: "Diagnostic test", url: "/settings" }),
        );
        return { subId: sub.id, ok: true, statusCode: res.statusCode };
      } catch (err) {
        const e = err as { statusCode?: number; message?: string; body?: string };
        return { subId: sub.id, ok: false, statusCode: e.statusCode, message: e.message, body: e.body };
      }
    }),
  );

  return NextResponse.json({ userId, subscriptionCount: subs.length, results });
}
