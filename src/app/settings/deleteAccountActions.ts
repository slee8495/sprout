"use server";

import { del } from "@vercel/blob";
import { signOut } from "@/auth";
import { deleteFamilyAccount, getFamilyBilling, getFamilyDeletionSummary } from "@/db/queries";
import { requireSession } from "@/lib/session";
import { getStripe } from "@/lib/stripe";

export async function deleteAccountAction(confirmedName: string) {
  const { familyId } = await requireSession();

  const summary = await getFamilyDeletionSummary(familyId);
  if (confirmedName.trim() !== summary.familyName) {
    throw new Error("Name didn't match — nothing was deleted.");
  }

  const billing = await getFamilyBilling(familyId);
  if (billing.stripeSubscriptionId) {
    await getStripe().subscriptions.cancel(billing.stripeSubscriptionId);
  }

  const blobUrls = await deleteFamilyAccount(familyId);

  if (blobUrls.length) {
    try {
      await del(blobUrls);
    } catch (err) {
      console.error("Failed to delete blob files after account deletion:", err);
    }
  }

  await signOut({ redirectTo: "/login?deleted=1" });
}
