"use client";

import type { FamilyBilling } from "@/db/queries";
import { fill } from "@/lib/i18n";
import { useSettings } from "../SettingsProvider";
import { openBillingPortal, startStorageAddonCheckout, startSubscriptionCheckout } from "./billingActions";

const buttonClasses =
  "rounded-full bg-emerald-600 px-4 py-1.5 font-heading text-sm font-semibold text-white shadow-sm shadow-emerald-900/20 transition-transform hover:scale-105 hover:bg-emerald-700 active:scale-95";
const secondaryButtonClasses =
  "rounded-full border border-emerald-600 px-4 py-1.5 font-heading text-sm font-semibold text-emerald-700 transition-transform hover:scale-105 active:scale-95 dark:text-emerald-300";

export function BillingCard({
  billing,
  priceLabel,
  showAddon,
}: {
  billing: FamilyBilling;
  priceLabel: string | null;
  showAddon: boolean;
}) {
  const { t } = useSettings();
  const isPaid = billing.subscriptionStatus === "active" || billing.subscriptionStatus === "past_due";
  const wasSubscribed = billing.subscriptionStatus === "canceled";

  return (
    <section className="flex flex-col gap-3 rounded-3xl border border-emerald-200/70 bg-white p-4 dark:border-emerald-800/50 dark:bg-zinc-900">
      <h2 className="font-heading text-sm font-semibold text-emerald-800 dark:text-emerald-200">{t("Plan")}</h2>

      {isPaid ? (
        <>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            {t("Pro plan")}
            {billing.subscriptionRenewsAt &&
              ` — ${fill(t("renews {date}"), {
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
          <div className="flex flex-wrap gap-2">
            <form action={openBillingPortal}>
              <button type="submit" className={secondaryButtonClasses}>
                {t("Manage billing")}
              </button>
            </form>
            {showAddon && (
              <form action={startStorageAddonCheckout}>
                <button type="submit" className={secondaryButtonClasses}>
                  {t("Buy +5GB storage")}
                </button>
              </form>
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
