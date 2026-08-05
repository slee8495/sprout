import Link from "next/link";
import { auth, signOut } from "@/auth";
import {
  getFamilyBilling,
  getFamilyDeletionSummary,
  getFamilySettings,
  getFamilyStorageUsage,
  listChildren,
} from "@/db/queries";
import { requireSession } from "@/lib/session";
import { getStorageQuota } from "@/lib/storage";
import { formatPrice, getStripe } from "@/lib/stripe";
import { InviteCodeCard } from "../InviteCodeCard";
import { T } from "../T";
import { BillingCard } from "./BillingCard";
import { ChildrenCard } from "./ChildrenCard";
import { DeleteAccountCard } from "./DeleteAccountCard";
import { FamilySettingsForm } from "./FamilySettingsForm";
import { StorageCard } from "./StorageCard";

async function getSubscriptionPriceLabel() {
  if (!process.env.STRIPE_PRICE_ID) return null;
  try {
    const price = await getStripe().prices.retrieve(process.env.STRIPE_PRICE_ID);
    return formatPrice(price);
  } catch {
    return null;
  }
}

export default async function SettingsPage() {
  const { familyId } = await requireSession();
  const [settings, kids, storageUsed, billing, priceLabel, deletionSummary] = await Promise.all([
    getFamilySettings(familyId),
    listChildren(familyId),
    getFamilyStorageUsage(familyId),
    getFamilyBilling(familyId),
    getSubscriptionPriceLabel(),
    getFamilyDeletionSummary(familyId),
  ]);
  const session = await auth();
  const quota = getStorageQuota(billing);

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 p-4 pb-24">
      <header className="pt-4">
        <h1 className="font-heading text-2xl font-bold text-emerald-700 dark:text-emerald-300">
          <T>⚙️ Settings</T>
        </h1>
      </header>
      <InviteCodeCard inviteCode={settings.inviteCode} />
      <BillingCard billing={billing} priceLabel={priceLabel} showAddon={storageUsed / quota > 0.8} />
      <StorageCard usedBytes={storageUsed} quotaBytes={quota} />
      <ChildrenCard kids={kids} />
      <FamilySettingsForm />
      <section className="flex flex-col gap-2 rounded-3xl border border-emerald-200/70 bg-white p-4 dark:border-emerald-800/50 dark:bg-zinc-900">
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
