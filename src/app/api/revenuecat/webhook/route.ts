import { NextResponse } from "next/server";
import { incrementStorageAddon, updateFamilyBilling } from "@/db/queries";
import type { billingSourceEnum, subscriptionStatusEnum } from "@/db/schema";
import { STORAGE_ADDON_BYTES } from "@/lib/storage";

// RevenueCat tells us what Apple (and later Google) did with a subscription, the same way
// /api/stripe/webhook does for the web. Both write to the same `subscriptionStatus` on the family,
// so the rest of the app never has to care which store a family paid through — only
// `billingSource` differs, and that exists so the UI can send people to the right place to cancel.
//
// The two never collide: a family that bought through Apple has no Stripe customer, so Stripe
// sends no events for it, and vice versa.

type SubscriptionStatus = (typeof subscriptionStatusEnum.enumValues)[number];
type BillingSource = (typeof billingSourceEnum.enumValues)[number];

// https://www.revenuecat.com/docs/integrations/webhooks/event-types-and-fields
type RevenueCatEvent = {
  type: string;
  app_user_id?: string;
  original_app_user_id?: string;
  store?: string;
  expiration_at_ms?: number | null;
  product_id?: string;
  period_type?: string;
};

// The app identifies a family to RevenueCat as `family_<id>` (see src/lib/nativePurchases.ts).
function familyIdFrom(event: RevenueCatEvent): number | null {
  const raw = event.app_user_id ?? event.original_app_user_id ?? "";
  const match = /^family_(\d+)$/.exec(raw);
  return match ? Number(match[1]) : null;
}

function billingSourceFrom(store: string | undefined): BillingSource {
  if (store === "PLAY_STORE") return "google";
  if (store === "STRIPE") return "stripe";
  return "apple"; // APP_STORE, MAC_APP_STORE, and anything Apple adds later
}

// A one-off storage add-on isn't a subscription, so it takes the other branch entirely.
function isStorageAddon(productId: string | undefined) {
  return !!productId && productId.includes("storage");
}

/** null means "this event says nothing about whether the family is currently paid". */
function statusFor(type: string): SubscriptionStatus | null {
  switch (type) {
    case "INITIAL_PURCHASE":
    case "RENEWAL":
    case "PRODUCT_CHANGE":
    case "UNCANCELLATION":
    case "SUBSCRIPTION_EXTENDED":
      return "active";
    case "BILLING_ISSUE":
      return "past_due";
    case "EXPIRATION":
      return "canceled";
    // CANCELLATION means auto-renew was switched off, not that access ended — the family keeps Pro
    // until the period they already paid for runs out, and EXPIRATION arrives then.
    case "CANCELLATION":
    default:
      return null;
  }
}

export async function POST(request: Request) {
  const secret = process.env.REVENUECAT_WEBHOOK_SECRET;
  if (!secret) {
    return NextResponse.json({ error: "Webhook not configured" }, { status: 500 });
  }
  if (request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const payload = (await request.json().catch(() => null)) as { event?: RevenueCatEvent } | null;
  const event = payload?.event;
  if (!event?.type) return NextResponse.json({ error: "Missing event" }, { status: 400 });

  const familyId = familyIdFrom(event);
  if (!familyId) {
    // A purchase made before the app knew which family it belonged to has nothing to apply to.
    // Answer 200 so RevenueCat stops retrying something that will never succeed.
    console.warn("[revenuecat] event with no family id", event.type, event.app_user_id);
    return NextResponse.json({ received: true, ignored: "no family id" });
  }

  if (event.type === "NON_RENEWING_PURCHASE" && isStorageAddon(event.product_id)) {
    await incrementStorageAddon(familyId, STORAGE_ADDON_BYTES);
    return NextResponse.json({ received: true });
  }

  const status = statusFor(event.type);
  if (!status) return NextResponse.json({ received: true, ignored: event.type });

  await updateFamilyBilling(familyId, {
    subscriptionStatus: status,
    subscriptionRenewsAt: event.expiration_at_ms ? new Date(event.expiration_at_ms) : null,
    billingSource: billingSourceFrom(event.store),
    // Apple's own introductory offer is its own thing; `isTrial` only ever described the signup
    // trial this app grants itself, so leave it off for store-driven subscriptions.
    isTrial: false,
  });

  return NextResponse.json({ received: true });
}
