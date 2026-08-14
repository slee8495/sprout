"use client";

import { useTransition } from "react";
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

export function BillingCard({
  billing,
  priceLabel,
  addonPriceLabel,
  cancelAtPeriodEnd,
}: {
  billing: FamilyBilling;
  priceLabel: string | null;
  addonPriceLabel: string | null;
  cancelAtPeriodEnd: boolean;
}) {
  const { t } = useSettings();
  const [isPending, startTransition] = useTransition();
  const isPaid = billing.subscriptionStatus === "active" || billing.subscriptionStatus === "past_due";
  const wasSubscribed = billing.subscriptionStatus === "canceled";
  // Admin-granted free access (no real Stripe subscription behind it) — distinct from a real subscriber.
  const isComplimentary = isPaid && !billing.stripeCustomerId;

  function handleCancel() {
    if (!confirm(t("Switch to Free? You'll keep Pro until your current period ends."))) return;
    startTransition(() => cancelSubscription());
  }

  function handleResume() {
    startTransition(() => resumeSubscription());
  }

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
          <form action={startSubscriptionCheckout}>
            <button type="submit" className={buttonClasses}>
              {t("Upgrade to Pro")}
              {priceLabel ? ` — ${priceLabel}` : ""}
            </button>
          </form>
        </>
      )}
    </section>
  );
}
