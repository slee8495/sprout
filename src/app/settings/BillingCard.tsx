"use client";

import { useEffect, useState, useTransition } from "react";
import { Capacitor } from "@capacitor/core";
import type { FamilyBilling } from "@/db/queries";
import { fill } from "@/lib/i18n";
import { useSettings } from "../SettingsProvider";
import {
  cancelSubscription,
  openBillingPortal,
  resumeSubscription,
  startStorageAddonCheckout,
  startSubscriptionCheckout,
} from "./billingActions";

const buttonClasses =
  "rounded-full bg-brand-600 px-4 py-1.5 font-heading text-sm font-semibold text-white shadow-sm shadow-brand-900/20 transition-transform hover:scale-105 hover:bg-brand-700 active:scale-95";
const secondaryButtonClasses =
  "rounded-full border border-brand-600 px-4 py-1.5 font-heading text-sm font-semibold text-brand-700 transition-transform hover:scale-105 active:scale-95 dark:text-brand-300";
const textButtonClasses = "font-heading text-sm font-semibold text-rose-600 underline dark:text-rose-400";

// Pulls the numeric amount out of a formatted price label like "$3.99/month" — used only to show
// a "save X%" hint on the annual toggle, so an unparseable label just means no hint, not an error.
function parsePriceAmount(label: string | null): number | null {
  const match = label?.match(/[\d.]+/);
  return match ? Number(match[0]) : null;
}

export function BillingCard({
  billing,
  priceLabel,
  annualPriceLabel,
  addonPriceLabel,
  cancelAtPeriodEnd,
}: {
  billing: FamilyBilling;
  priceLabel: string | null;
  annualPriceLabel: string | null;
  addonPriceLabel: string | null;
  cancelAtPeriodEnd: boolean;
}) {
  const { t } = useSettings();
  const [isPending, startTransition] = useTransition();
  const [interval, setInterval] = useState<"month" | "year">("month");
  // Stripe Checkout/billing portal are web-hosted pages — redirecting to them from inside the
  // native app's WebView would violate App Store/Play Store guidelines on in-app digital purchases.
  // Hide the whole card on native until RevenueCat's native IAP replaces these flows; Pro sign-up
  // stays reachable at roun.sl-studio.dev in the meantime.
  const [hideOnNative, setHideOnNative] = useState(false);
  const isPaid = billing.subscriptionStatus === "active" || billing.subscriptionStatus === "past_due";
  const wasSubscribed = billing.subscriptionStatus === "canceled";
  // Admin-granted free access (no real Stripe subscription behind it) — distinct from a real subscriber.
  const isComplimentary = isPaid && !billing.stripeCustomerId;

  useEffect(() => {
    setHideOnNative(Capacitor.isNativePlatform());
  }, []);

  function handleCancel() {
    if (!confirm(t("Switch to Free? You'll keep Pro until your current period ends."))) return;
    startTransition(() => cancelSubscription());
  }

  function handleResume() {
    startTransition(() => resumeSubscription());
  }

  function handleUpgrade() {
    startTransition(() => startSubscriptionCheckout(interval));
  }

  const monthlyAmount = parsePriceAmount(priceLabel);
  const annualAmount = parsePriceAmount(annualPriceLabel);
  const annualSavingsPercent =
    monthlyAmount && annualAmount ? Math.round((1 - annualAmount / (monthlyAmount * 12)) * 100) : null;

  if (hideOnNative) return null;

  return (
    <section className="flex flex-col gap-3 rounded-3xl border border-brand-200/70 bg-white p-4 dark:border-brand-800/50 dark:bg-zinc-900">
      <h2 className="font-heading text-sm font-semibold text-brand-800 dark:text-brand-200">{t("Plan")}</h2>

      {isComplimentary ? (
        <>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            {t(billing.isTrial ? "Free trial" : "Pro plan (complimentary)")}
            {billing.subscriptionRenewsAt
              ? ` — ${fill(t(billing.isTrial ? "ends {date}" : "free until {date}"), {
                  date: billing.subscriptionRenewsAt.toLocaleDateString(undefined, {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                  }),
                })}`
              : ` — ${t("free forever")}`}
          </p>
          {billing.isTrial && priceLabel && (
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              {fill(t("Then {price} after your trial ends."), { price: priceLabel })}
            </p>
          )}
          <form action={startStorageAddonCheckout}>
            <button type="submit" className={secondaryButtonClasses}>
              {t("Buy +5GB storage")}
              {addonPriceLabel ? ` — ${addonPriceLabel}` : ""}
            </button>
          </form>
        </>
      ) : isPaid ? (
        <>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            {t("Pro plan")}
            {billing.subscriptionRenewsAt &&
              ` — ${fill(t(cancelAtPeriodEnd ? "ends {date}" : "renews {date}"), {
                date: billing.subscriptionRenewsAt.toLocaleDateString(undefined, {
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                }),
              })}`}
          </p>
          {billing.subscriptionStatus === "past_due" && (
            <p className="text-sm text-rose-600">
              {t("Payment failed — update your card to keep your Pro plan.")}
            </p>
          )}
          {cancelAtPeriodEnd && (
            <p className="text-sm text-amber-600 dark:text-amber-400">
              {t("Switching to Free at the end of this period.")}
            </p>
          )}
          <div className="flex flex-wrap items-center gap-2">
            <form action={openBillingPortal}>
              <button type="submit" className={secondaryButtonClasses}>
                {t("Manage billing")}
              </button>
            </form>
            <form action={startStorageAddonCheckout}>
              <button type="submit" className={secondaryButtonClasses}>
                {t("Buy +5GB storage")}
                {addonPriceLabel ? ` — ${addonPriceLabel}` : ""}
              </button>
            </form>
            {cancelAtPeriodEnd ? (
              <button type="button" onClick={handleResume} disabled={isPending} className={buttonClasses}>
                {t("Resume Pro plan")}
              </button>
            ) : (
              <button type="button" onClick={handleCancel} disabled={isPending} className={textButtonClasses}>
                {t("Switch to Free")}
              </button>
            )}
          </div>
        </>
      ) : (
        <>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            {wasSubscribed ? t("Free plan (previously subscribed)") : t("Free plan")}
            {t(" — 1 child or pet, 1GB storage.")}
          </p>
          {annualPriceLabel && (
            <div className="flex gap-1.5">
              <button
                type="button"
                onClick={() => setInterval("month")}
                className={`rounded-full px-3 py-1 font-heading text-xs font-semibold transition-colors ${
                  interval === "month"
                    ? "bg-brand-600 text-white"
                    : "border border-brand-200 text-brand-700 dark:border-brand-800 dark:text-brand-300"
                }`}
              >
                {t("Monthly")}
              </button>
              <button
                type="button"
                onClick={() => setInterval("year")}
                className={`rounded-full px-3 py-1 font-heading text-xs font-semibold transition-colors ${
                  interval === "year"
                    ? "bg-brand-600 text-white"
                    : "border border-brand-200 text-brand-700 dark:border-brand-800 dark:text-brand-300"
                }`}
              >
                {t("Annual")}
                {annualSavingsPercent != null && ` — ${fill(t("save {percent}%"), { percent: annualSavingsPercent })}`}
              </button>
            </div>
          )}
          <button type="button" onClick={handleUpgrade} disabled={isPending} className={buttonClasses}>
            {t("Upgrade to Pro")}
            {(interval === "year" ? annualPriceLabel : priceLabel) &&
              ` — ${interval === "year" ? annualPriceLabel : priceLabel}`}
          </button>
        </>
      )}
    </section>
  );
}
