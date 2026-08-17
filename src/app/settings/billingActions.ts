"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getFamilyBilling, updateFamilyBilling } from "@/db/queries";
import { requireSession } from "@/lib/session";
import { getStripe } from "@/lib/stripe";

async function getOrigin() {
  const host = (await headers()).get("host") ?? "localhost:3000";
  const protocol = host.startsWith("localhost") || host.startsWith("127.0.0.1") ? "http" : "https";
  return `${protocol}://${host}`;
}

async function getOrCreateCustomerId(familyId: number, customerId: string | null) {
  if (customerId) return customerId;
  const customer = await getStripe().customers.create({ metadata: { familyId: String(familyId) } });
  await updateFamilyBilling(familyId, { stripeCustomerId: customer.id });
  return customer.id;
}

export async function startSubscriptionCheckout(interval: "month" | "year" = "month") {
  const { familyId } = await requireSession();
  const billing = await getFamilyBilling(familyId);
  const customerId = await getOrCreateCustomerId(familyId, billing.stripeCustomerId);
  const origin = await getOrigin();
  const priceId = interval === "year" ? process.env.STRIPE_ANNUAL_PRICE_ID! : process.env.STRIPE_PRICE_ID!;

  const session = await getStripe().checkout.sessions.create({
    mode: "subscription",
    customer: customerId,
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${origin}/settings?checkout=success`,
    cancel_url: `${origin}/settings?checkout=cancel`,
    client_reference_id: String(familyId),
  });

  if (!session.url) throw new Error("Couldn't start checkout — try again.");
  redirect(session.url);
}

export async function startStorageAddonCheckout() {
  const { familyId } = await requireSession();
  const billing = await getFamilyBilling(familyId);
  const customerId = await getOrCreateCustomerId(familyId, billing.stripeCustomerId);
  const origin = await getOrigin();

  const session = await getStripe().checkout.sessions.create({
    mode: "payment",
    customer: customerId,
    line_items: [{ price: process.env.STRIPE_STORAGE_ADDON_PRICE_ID!, quantity: 1 }],
    success_url: `${origin}/settings?addon=success`,
    cancel_url: `${origin}/settings?addon=cancel`,
    client_reference_id: String(familyId),
  });

  if (!session.url) throw new Error("Couldn't start checkout — try again.");
  redirect(session.url);
}

// In-app equivalent of canceling through the Stripe billing portal — lets a family switch back
// to Free without depending on that portal's own "cancel subscription" feature being enabled.
// Cancels at the end of the paid period rather than immediately, so they keep Pro through what
// they already paid for.
export async function cancelSubscription() {
  const { familyId } = await requireSession();
  const billing = await getFamilyBilling(familyId);
  if (!billing.stripeSubscriptionId) throw new Error("No active subscription to cancel.");

  await getStripe().subscriptions.update(billing.stripeSubscriptionId, { cancel_at_period_end: true });
  revalidatePath("/settings");
}

// Undoes cancelSubscription() before the period end — lets someone switch back to Pro without
// risking a second, duplicate subscription (starting a fresh checkout while the old subscription
// is still active-but-pending-cancellation would double-charge).
export async function resumeSubscription() {
  const { familyId } = await requireSession();
  const billing = await getFamilyBilling(familyId);
  if (!billing.stripeSubscriptionId) throw new Error("No subscription to resume.");

  await getStripe().subscriptions.update(billing.stripeSubscriptionId, { cancel_at_period_end: false });
  revalidatePath("/settings");
}

export async function openBillingPortal() {
  const { familyId } = await requireSession();
  const billing = await getFamilyBilling(familyId);
  if (!billing.stripeCustomerId) throw new Error("No billing account yet — subscribe first.");
  const origin = await getOrigin();

  const session = await getStripe().billingPortal.sessions.create({
    customer: billing.stripeCustomerId,
    return_url: `${origin}/settings`,
  });
  redirect(session.url);
}
