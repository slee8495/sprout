import Link from "next/link";
import { auth, signOut } from "@/auth";
import {
  getFamilyBilling,
  getFamilyDeletionSummary,
  getFamilySettings,
  getFamilyStorageUsage,
  listChildren,
  listFamilyMembers,
} from "@/db/queries";
import { requireSession } from "@/lib/session";
import { getStorageQuota } from "@/lib/storage";
import { getPriceLabel, getStripe } from "@/lib/stripe";
import { InviteCodeCard } from "../InviteCodeCard";
import { T } from "../T";
import { BillingCard } from "./BillingCard";
import { ChildrenCard } from "./ChildrenCard";
import { DeleteAccountCard } from "./DeleteAccountCard";
import { FamilyMembersCard } from "./FamilyMembersCard";
import { FamilySettingsForm } from "./FamilySettingsForm";
import { NotificationsCard } from "./NotificationsCard";
import { StorageCard } from "./StorageCard";

// Whether a Pro subscription is scheduled to end at the current period rather than renew — the
// DB only tracks subscriptionStatus/renewsAt, not this, so it's read live from Stripe (same
// pattern as the price labels above) whenever there's a subscription to check.
async function getCancelAtPeriodEnd(subscriptionId: string | null) {
  if (!subscriptionId) return false;
  try {
    const subscription = await getStripe().subscriptions.retrieve(subscriptionId);
    return subscription.cancel_at_period_end;
  } catch {
    return false;
  }
}

export default async function SettingsPage() {
  const { familyId, userId, role } = await requireSession();
  const [settings, kids, storageUsed, billing, priceLabel, annualPriceLabel, addonPriceLabel, deletionSummary, members] =
    await Promise.all([
      getFamilySettings(familyId),
      listChildren(familyId),
      getFamilyStorageUsage(familyId),
      getFamilyBilling(familyId),
      getPriceLabel(process.env.STRIPE_PRICE_ID),
      getPriceLabel(process.env.STRIPE_ANNUAL_PRICE_ID),
      getPriceLabel(process.env.STRIPE_STORAGE_ADDON_PRICE_ID),
      getFamilyDeletionSummary(familyId),
      listFamilyMembers(familyId),
    ]);
  const cancelAtPeriodEnd = await getCancelAtPeriodEnd(billing.stripeSubscriptionId);
  const session = await auth();
  const quota = getStorageQuota(billing);

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 p-4 pb-24">
      <header className="pt-4">
        <h1 className="font-heading text-2xl font-bold text-brand-700 dark:text-brand-300">
          <T>⚙️ Settings</T>
        </h1>
      </header>
      <InviteCodeCard inviteCode={settings.inviteCode} />
      <BillingCard
        billing={billing}
        familyId={familyId}
        priceLabel={priceLabel}
        annualPriceLabel={annualPriceLabel}
        addonPriceLabel={addonPriceLabel}
        cancelAtPeriodEnd={cancelAtPeriodEnd}
      />
      <StorageCard usedBytes={storageUsed} quotaBytes={quota} />
      <NotificationsCard />
      <ChildrenCard kids={kids} />
      <FamilyMembersCard members={members} isOwner={role === "owner"} userId={userId} />
      <FamilySettingsForm />
      <section className="flex flex-col gap-2 rounded-3xl border border-brand-200/70 bg-white p-4 dark:border-brand-800/50 dark:bg-zinc-900">
        {session?.user?.email && (
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            <T>Signed in as</T> {session.user.email}
          </p>
        )}
        <form
          action={async () => {
            "use server";
            await signOut({ redirectTo: "/login" });
          }}
        >
          <button
            type="submit"
            className="w-full rounded-full border border-rose-200 px-4 py-2 font-heading text-sm font-semibold text-rose-600 transition-transform hover:scale-105 active:scale-95 dark:border-rose-900/50 dark:text-rose-400"
          >
            <T>Sign out</T>
          </button>
        </form>
      </section>
      <DeleteAccountCard
        familyName={deletionSummary.familyName}
        entries={deletionSummary.entries}
        photos={deletionSummary.photos}
        members={deletionSummary.users}
        isOwner={role === "owner"}
      />
      <p className="text-center text-xs text-zinc-500 dark:text-zinc-400">
        <Link href="/terms" className="underline">
          <T>Terms</T>
        </Link>{" "}
        ·{" "}
        <Link href="/privacy" className="underline">
          <T>Privacy Policy</T>
        </Link>
      </p>
    </div>
  );
}
