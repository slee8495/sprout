"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
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

export async function startSubscriptionCheckout() {
  const { familyId } = await requireSession();
  const billing = await getFamilyBilling(familyId);
  const customerId = await getOrCreateCustomerId(familyId, billing.stripeCustomerId);
  const origin = await getOrigin();

  const session = await getStripe().checkout.sessions.create({
    mode: "subscription",
    customer: customerId,
    line_items: [{ price: process.env.STRIPE_PRICE_ID!, quantity: 1 }],
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
