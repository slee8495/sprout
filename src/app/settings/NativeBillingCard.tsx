"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Capacitor } from "@capacitor/core";
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
//
// The card also has to say what the money buys. App Review rejected 1.0 (5) under guideline
// 3.1.2(c) — "does not clearly describe what the user will receive for the price" — against a
// version of this card that listed the free plan's limits and then two priced buttons, and nothing
// about Pro itself. So everything a subscription has to disclose before purchase lives here now:
// what Pro includes, the billing period beside each price, how renewal and cancellation work, and
// links to the terms and the privacy policy.

const buttonClasses =
  "flex flex-col items-center rounded-2xl bg-brand-600 px-4 py-2 font-heading text-sm font-semibold text-white shadow-sm shadow-brand-900/20 transition-transform hover:scale-105 hover:bg-brand-700 active:scale-95 disabled:opacity-60";
const secondaryButtonClasses =
  "rounded-full border border-brand-600 px-4 py-1.5 font-heading text-sm font-semibold text-brand-700 transition-transform hover:scale-105 active:scale-95 disabled:opacity-60 dark:text-brand-300";

export function NativeBillingCard({ billing, familyId }: { billing: FamilyBilling; familyId: number }) {
  const { t } = useSettings();
  const router = useRouter();

  const [packages, setPackages] = useState<ProPackage[] | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // "Paid" here has to mean a subscription Apple or Google actually sold us, not merely an active
  // status. The signup trial and admin-granted access both leave the status "active" with nothing
  // behind it, and treating those as a store subscription sent a family that had only just signed
  // up to Settings → Apple Account → Subscriptions to cancel something that isn't there — and hid
  // the purchase this card exists to offer. App Review sign up fresh, so that is exactly what they
  // would have seen.
  const isPaid =
    (billing.billingSource === "apple" || billing.billingSource === "google") &&
    (billing.subscriptionStatus === "active" || billing.subscriptionStatus === "past_due");

  // Pro that came from somewhere else — the signup trial, or a subscription bought on the web.
  // Say so plainly, and still offer the Apple purchase underneath.
  const proFromElsewhere =
    !isPaid && (billing.subscriptionStatus === "active" || billing.subscriptionStatus === "past_due");

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
            {proFromElsewhere
              ? billing.isTrial && billing.subscriptionRenewsAt
                ? fill(t("Free trial — ends {date}"), {
                    date: billing.subscriptionRenewsAt.toLocaleDateString(undefined, {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    }),
                  })
                : t("Pro plan")
              : `${t("Free plan")}${t(" — 1 child or pet, 1GB storage.")}`}
          </p>

          {packages === null ? (
            <p className="text-sm text-zinc-500 dark:text-zinc-400">{t("Loading plans…")}</p>
          ) : packages.length === 0 ? (
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              {t("Plans aren't available right now. Please try again later.")}
            </p>
          ) : (
            <>
              <div className="flex flex-col gap-1.5 rounded-2xl bg-brand-50 p-3 dark:bg-brand-950/40">
                <p className="font-heading text-sm font-semibold text-brand-800 dark:text-brand-200">
                  {t("What you get with Roun Pro")}
                </p>
                <ul className="flex list-disc flex-col gap-1 pl-5 text-sm text-zinc-600 dark:text-zinc-400">
                  <li>{t("Unlimited kids and pets — the free plan covers one")}</li>
                  <li>{t("5GB of photo and video storage — the free plan has 1GB")}</li>
                  <li>{t("No ads")}</li>
                </ul>
              </div>

              {/* The billing period sits under the price rather than only in the plan's name, so the
                  price is never shown without the term it buys. */}
              <div className="flex flex-wrap gap-2">
                {packages.map((pkg) => (
                  <button
                    key={pkg.id}
                    type="button"
                    onClick={() => handlePurchase(pkg)}
                    disabled={busy}
                    className={buttonClasses}
                  >
                    <span>{pkg.interval === "year" ? t("Pro — yearly") : t("Pro — monthly")}</span>
                    <span className="text-xs font-normal opacity-90">
                      {fill(t(pkg.interval === "year" ? "{price} per year" : "{price} per month"), {
                        price: pkg.priceLabel,
                      })}
                    </span>
                  </button>
                ))}
              </div>

              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                {Capacitor.getPlatform() === "android"
                  ? t(
                      "Payment is charged to your Google Play account at confirmation of purchase. It renews automatically unless you cancel at least 24 hours before the period ends, and you can manage or cancel it in Google Play → Subscriptions.",
                    )
                  : t(
                      "Payment is charged to your Apple Account at confirmation of purchase. It renews automatically unless you turn off auto-renew at least 24 hours before the period ends, and you can manage or cancel it in Settings → Apple Account → Subscriptions.",
                    )}
              </p>

              {/* Guideline 3.1.2 wants both of these reachable from the purchase screen itself, not
                  only from the App Store listing. Both are same-origin, so they open in the app's
                  own web view — and each carries its own way back, since the nav is hidden there. */}
              <p className="flex gap-3 text-xs">
                <Link href="/terms" className="font-semibold text-brand-700 underline dark:text-brand-300">
                  {t("Terms of Use")}
                </Link>
                <Link href="/privacy" className="font-semibold text-brand-700 underline dark:text-brand-300">
                  {t("Privacy Policy")}
                </Link>
              </p>
            </>
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
