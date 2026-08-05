import type { subscriptionStatusEnum } from "@/db/schema";

export const FREE_STORAGE_QUOTA_BYTES = 1 * 1024 * 1024 * 1024;
export const PAID_STORAGE_QUOTA_BYTES = 5 * 1024 * 1024 * 1024;
export const STORAGE_ADDON_BYTES = 5 * 1024 * 1024 * 1024;
export const FREE_CHILD_LIMIT = 1;

type SubscriptionStatus = (typeof subscriptionStatusEnum.enumValues)[number];

export function isPaidStatus(status: SubscriptionStatus): boolean {
  return status === "active" || status === "past_due";
}

export function getStorageQuota(billing: { subscriptionStatus: SubscriptionStatus; storageAddonBytes: number }): number {
  const base = isPaidStatus(billing.subscriptionStatus) ? PAID_STORAGE_QUOTA_BYTES : FREE_STORAGE_QUOTA_BYTES;
  return base + billing.storageAddonBytes;
}

export function formatBytes(bytes: number): string {
  const mb = bytes / (1024 * 1024);
  if (mb < 1000) return `${mb.toFixed(mb < 10 ? 1 : 0)}MB`;
  return `${(mb / 1024).toFixed(2)}GB`;
}
