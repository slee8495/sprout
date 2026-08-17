import { NextResponse } from "next/server";
import type Stripe from "stripe";
import {
  getFamilyByStripeCustomerId,
  incrementStorageAddon,
  listFamilyMemberEmails,
  updateFamilyBilling,
} from "@/db/queries";
import { subscriptionStatusEnum } from "@/db/schema";
import { groupByLocale, sendEmail } from "@/lib/email";
import { subscriptionCanceledEmail } from "@/lib/emailTemplates";
import type { Locale } from "@/lib/i18n";
import { STORAGE_ADDON_BYTES } from "@/lib/storage";
import { getStripe } from "@/lib/stripe";

// Webhooks are called server-to-server by Stripe, not from a user's browser, so there's no
// request origin to derive the app URL from — this is the app's one fixed production domain.
const APP_URL = "https://roun.sl-studio.dev";

type SubscriptionStatus = (typeof subscriptionStatusEnum.enumValues)[number];

function mapStripeStatus(status: Stripe.Subscription.Status): SubscriptionStatus {
  if (status === "active" || status === "trialing") return "active";
  if (status === "past_due") return "past_due";
  return "canceled";
}

export async function POST(request: Request) {
  const signature = request.headers.get("stripe-signature");
  if (!signature) return NextResponse.json({ error: "Missing signature" }, { status: 400 });

  const rawBody = await request.text();
  let event: Stripe.Event;
  try {
    event = getStripe().webhooks.constructEvent(rawBody, signature, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch (error) {
    return NextResponse.json({ error: `Invalid signature: ${(error as Error).message}` }, { status: 400 });
  }

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      const familyId = Number(session.client_reference_id);
      if (!familyId) break;

      if (session.mode === "subscription" && session.subscription) {
        const subscription = await getStripe().subscriptions.retrieve(session.subscription as string);
        const item = subscription.items.data[0];
        await updateFamilyBilling(familyId, {
          stripeCustomerId: session.customer as string,
          stripeSubscriptionId: subscription.id,
          subscriptionStatus: mapStripeStatus(subscription.status),
          subscriptionRenewsAt: item ? new Date(item.current_period_end * 1000) : null,
        });
      } else if (session.mode === "payment") {
        await incrementStorageAddon(familyId, STORAGE_ADDON_BYTES);
      }
      break;
    }

    case "customer.subscription.updated":
    case "customer.subscription.deleted": {
      const subscription = event.data.object as Stripe.Subscription;
      const family = await getFamilyByStripeCustomerId(subscription.customer as string);
      if (!family) break;

      const item = subscription.items.data[0];
      await updateFamilyBilling(family.id, {
        stripeSubscriptionId: subscription.id,
        subscriptionStatus: event.type === "customer.subscription.deleted" ? "canceled" : mapStripeStatus(subscription.status),
        subscriptionRenewsAt: item ? new Date(item.current_period_end * 1000) : null,
      });

      if (event.type === "customer.subscription.deleted") {
        const members = await listFamilyMemberEmails(family.id);
        const byLocale = groupByLocale(members);
        await Promise.all(
          Object.entries(byLocale).map(([locale, group]) =>
            sendEmail({
              to: group.map((m) => m.email),
              ...subscriptionCanceledEmail({ appUrl: APP_URL, locale: locale as Locale }),
            }),
          ),
        ).catch(() => {}); // Best-effort — a failed notification email shouldn't fail the webhook.
      }
      break;
    }
  }

  return NextResponse.json({ received: true });
}
