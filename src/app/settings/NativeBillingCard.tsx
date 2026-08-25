"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { FamilyBilling } from "@/db/queries";
import { fill } from "@/lib/i18n";
import { getProPackages, purchasePro, restorePurchases, type ProPackage } from "@/lib/nativePurchases";
import { useSettings } from "../SettingsProvider";

// The Plan card as it appears inside the native apps, where Apple and Google require their own
// purchase systems (guideline 3.1.1) — so nothing here touches Stripe. BillingCard.tsx keeps the
// web version and decides which of the two to render.
//
// Prices come from the store rather than from our own price labels: they're already localized and
// they always match what the buyer is actually charged.

const buttonClasses =
  "rounded-full bg-brand-600 px-4 py-1.5 font-heading text-sm font-semibold text-white shadow-sm shadow-brand-900/20 transition-transform hover:scale-105 hover:bg-brand-700 active:scale-95 disabled:opacity-60";
const secondaryButtonClasses =
  "rounded-full border border-brand-600 px-4 py-1.5 font-heading text-sm font-semibold text-brand-700 transition-transform hover:scale-105 active:scale-95 disabled:opacity-60 dark:text-brand-300";

export function NativeBillingCard({ billing, familyId }: { billing: FamilyBilling; familyId: number }) {
  const { t } = useSettings();
  const router = useRouter();

  const [packages, setPackages] = useState<ProPackage[] | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isPaid = billing.subscriptionStatus === "active" || billing.subscriptionStatus === "past_due";

  useEffect(() => {
    let live = true;
    getProPackages(familyId)
      .then((found) => live && setPackages(found))
      .catch(() => live && setPackages([]));
    return () => {
      live = false;
    };
  }, [familyId]);

  // The store confirms instantly, but Pro is granted by RevenueCat's webhook, so the page has to
  // refetch rather than assume. Poll briefly instead of once — the webhook usually lands within a
  // second or two, and a stale "Free plan" right after paying is the worst thing to show.
  async function refreshUntilPaid() {
    for (let attempt = 0; attempt < 6; attempt++) {
      router.refresh();
      await new Promise((resolve) => setTimeout(resolve, 1500));
    }
  }

  async function handlePurchase(pkg: ProPackage) {
    setError(null);
    setBusy(true);
    try {
      const outcome = await purchasePro(familyId, pkg);
      if (outcome === "purchased") await refreshUntilPaid();
    } catch {
      setError(t("That purchase didn't go through. Nothing was charged — try again."));
    } finally {
      setBusy(false);
    }
  }

  async function handleRestore() {
    setError(null);
    setBusy(true);
    try {
      const restored = await restorePurchases(familyId);
      if (restored) await refreshUntilPaid();
      else setError(t("No previous purchase found on this account."));
    } catch {
      setError(t("Couldn't check for previous purchases — try again."));
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="flex flex-col gap-3 rounded-3xl border border-brand-200/70 bg-white p-4 dark:border-brand-800/50 dark:bg-zinc-900">
      <h2 className="font-heading text-sm font-semibold text-brand-800 dark:text-brand-200">{t("Plan")}</h2>

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
          {/* Apple and Google only let their own systems cancel a subscription they sold, so this
              says where to go rather than offering a button that couldn't work. */}
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            {billing.billingSource === "google"
              ? t("Manage or cancel this subscription in Google Play → Subscriptions.")
              : t("Manage or cancel this subscription in Settings → Apple Account → Subscriptions.")}
          </p>
        </>
      ) : (
        <>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            {t("Free plan")}
            {t(" — 1 child or pet, 1GB storage.")}
          </p>

          {packages === null ? (
            <p className="text-sm text-zinc-500 dark:text-zinc-400">{t("Loading plans…")}</p>
          ) : packages.length === 0 ? (
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              {t("Plans aren't available right now. Please try again later.")}
            </p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {packages.map((pkg) => (
                <button
                  key={pkg.id}
                  type="button"
                  onClick={() => handlePurchase(pkg)}
                  disabled={busy}
                  className={buttonClasses}
                >
                  {pkg.interval === "year" ? t("Pro — yearly") : t("Pro — monthly")} — {pkg.priceLabel}
                </button>
              ))}
            </div>
          )}
        </>
      )}

      {/* Apple requires a restore control wherever purchases are offered — a reinstall or a new
          device has the receipt on the Apple Account, not in our database. */}
      <button type="button" onClick={handleRestore} disabled={busy} className={`${secondaryButtonClasses} w-fit`}>
        {t("Restore purchases")}
      </button>

      {error && <p className="text-sm text-rose-600 dark:text-rose-400">{error}</p>}
    </section>
  );
}
