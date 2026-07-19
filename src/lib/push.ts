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
) {
  if (!vapidPublicKey || !vapidPrivateKey || !vapidSubject) return;

  const subscriptions = await listOtherFamilyPushSubscriptions(familyId, excludeUserId);
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
        }
      }
    }),
  );
}
