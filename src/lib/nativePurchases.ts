"use client";

import { Capacitor } from "@capacitor/core";
import type { PurchasesPackage } from "@revenuecat/purchases-capacitor";

// In-app purchase for the native apps, through RevenueCat. Apple and Google both require digital
// goods to be sold with their own systems (App Store guideline 3.1.1), so the Stripe Checkout flow
// the website uses can't appear inside the app at all — see settings/BillingCard.tsx for how the
// two are kept apart.
//
// RevenueCat sits in front of both stores so there's one purchase call, one receipt validator, and
// one webhook (/api/revenuecat/webhook) rather than a separate integration per platform.

/** Entitlement configured in the RevenueCat dashboard; granting it is what makes a family Pro. */
const PRO_ENTITLEMENT = "pro";

/**
 * Loaded on demand rather than imported at the top: every web visitor's Settings page would
 * otherwise carry a store SDK it can never call, and older native builds would evaluate a plugin
 * they don't have.
 */
function sdk() {
  return import("@revenuecat/purchases-capacitor");
}

/**
 * True only in a native shell that actually ships the plugin. The app loads its web build live from
 * production (Capacitor "remote URL" pattern), so this same code runs inside older installed
 * builds that predate in-app purchase — there the purchase UI has to stay hidden rather than throw.
 */
export function isNativePurchasesAvailable(): boolean {
  return (
    typeof window !== "undefined" &&
    Capacitor.isNativePlatform() &&
    Capacitor.isPluginAvailable("Purchases") &&
    !!apiKeyForPlatform()
  );
}

function apiKeyForPlatform(): string | undefined {
  return Capacitor.getPlatform() === "ios"
    ? process.env.NEXT_PUBLIC_REVENUECAT_IOS_KEY
    : process.env.NEXT_PUBLIC_REVENUECAT_ANDROID_KEY;
}

let configured: Promise<void> | null = null;

/**
 * Identifies the buyer to RevenueCat as the family, not the person: a subscription belongs to the
 * whole family in this app, and any member signing in on any device must see the same Pro status.
 * The webhook reads the family id back out of this (see /api/revenuecat/webhook).
 */
function configure(familyId: number): Promise<void> {
  const apiKey = apiKeyForPlatform();
  if (!apiKey) return Promise.reject(new Error("RevenueCat key missing for this platform"));

  configured ??= sdk()
    .then(({ Purchases }) => Purchases.configure({ apiKey, appUserID: `family_${familyId}` }))
    .catch((error) => {
      configured = null; // let the next attempt retry rather than caching the failure
      throw error;
    });
  return configured;
}

export type ProPackage = {
  id: string;
  /** "month" | "year", derived from the package RevenueCat returns. */
  interval: "month" | "year";
  /** Store-localized, already in the buyer's currency — never format this yourself. */
  priceLabel: string;
  raw: PurchasesPackage;
};

/**
 * The Pro packages this store offers, or an empty list when the store has nothing configured yet.
 * Prices come from the store, so they're localized and always match what the buyer is charged.
 */
export async function getProPackages(familyId: number): Promise<ProPackage[]> {
  const { Purchases } = await sdk();
  await configure(familyId);
  const { current } = await Purchases.getOfferings();
  if (!current) return [];

  return current.availablePackages
    .map((pkg) => {
      const interval = pkg.packageType === "ANNUAL" ? "year" : pkg.packageType === "MONTHLY" ? "month" : null;
      if (!interval) return null;
      return { id: pkg.identifier, interval, priceLabel: pkg.product.priceString, raw: pkg } satisfies ProPackage;
    })
    .filter((pkg): pkg is ProPackage => pkg !== null);
}

export type PurchaseOutcome = "purchased" | "cancelled";

/**
 * Runs the store's own purchase sheet. Backing out of that sheet is a normal thing to do, not an
 * error, so it comes back as "cancelled" instead of throwing — only real failures throw.
 *
 * Pro access still arrives via the webhook rather than from this return value: the store is the
 * source of truth, and the webhook is what every other device in the family hears about it through.
 */
export async function purchasePro(familyId: number, pkg: ProPackage): Promise<PurchaseOutcome> {
  const { Purchases, PURCHASES_ERROR_CODE } = await sdk();
  await configure(familyId);
  try {
    await Purchases.purchasePackage({ aPackage: pkg.raw });
    return "purchased";
  } catch (error) {
    if (isUserCancelled(error, PURCHASES_ERROR_CODE.PURCHASE_CANCELLED_ERROR)) return "cancelled";
    throw error;
  }
}

/**
 * Reinstalls and new devices need this: the receipt already exists on the Apple ID, and restoring
 * re-links it. Apple requires a restore control wherever purchases are offered.
 * Returns whether the family came back with Pro.
 */
export async function restorePurchases(familyId: number): Promise<boolean> {
  const { Purchases } = await sdk();
  await configure(familyId);
  const { customerInfo } = await Purchases.restorePurchases();
  return PRO_ENTITLEMENT in customerInfo.entitlements.active;
}

function isUserCancelled(error: unknown, cancelledCode: string): boolean {
  if (typeof error !== "object" || error === null) return false;
  const { code, userCancelled } = error as { code?: unknown; userCancelled?: unknown };
  return userCancelled === true || code === cancelledCode;
}
