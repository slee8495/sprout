import * as Sentry from "@sentry/nextjs";
import webpush from "web-push";
import { deletePushSubscription, listOtherFamilyPushSubscriptions } from "@/db/queries";

const vapidPublicKey = process.env.VAPID_PUBLIC_KEY;
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;
const vapidSubject = process.env.VAPID_SUBJECT;

if (vapidPublicKey && vapidPrivateKey && vapidSubject) {
  webpush.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey);
}

export async function notifyFamily(
  familyId: number,
  excludeUserId: number,
  payload: { title: string; body: string; url?: string },
  visibility?: "everyone" | "inner",
) {
  if (!vapidPublicKey || !vapidPrivateKey || !vapidSubject) return;

  const subscriptions = await listOtherFamilyPushSubscriptions(familyId, excludeUserId, visibility);
  const json = JSON.stringify(payload);

  await Promise.all(
    subscriptions.map(async (sub) => {
      try {
        await webpush.sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
          json,
        );
      } catch (err) {
        const statusCode = (err as { statusCode?: number }).statusCode;
        if (statusCode === 404 || statusCode === 410) {
          await deletePushSubscription(sub.endpoint);
        } else {
          // Anything else (bad VAPID keys, malformed payload, provider-side rejection, ...) was
          // previously swallowed here with zero visibility — surface it so real failures are
          // actually diagnosable instead of just "notifications don't show up sometimes".
          Sentry.captureException(err, { extra: { endpoint: sub.endpoint, statusCode } });
        }
      }
    }),
  );
}

// Fired when an upload gets blocked because the family is out of storage — a billing event
// with no human "actor", so it goes to everyone (no excluded user) rather than through the
// author-excluding notifyFamily() callers use for new entries/comments.
export async function notifyStorageFull(familyId: number, addonPriceLabel: string | null) {
  await notifyFamily(familyId, 0, {
    title: "📦 Storage full",
    body: addonPriceLabel
      ? `Your family's storage is full. Buy +5GB for ${addonPriceLabel} to keep saving photos and videos.`
      : "Your family's storage is full. Buy more storage in Settings to keep saving photos and videos.",
    url: "/settings",
  });
}
