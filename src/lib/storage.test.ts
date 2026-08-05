import { describe, expect, it } from "vitest";
import {
  FREE_STORAGE_QUOTA_BYTES,
  PAID_STORAGE_QUOTA_BYTES,
  getStorageQuota,
  isPaidStatus,
} from "./storage";

describe("isPaidStatus", () => {
  it("treats active and past_due as paid", () => {
    expect(isPaidStatus("active")).toBe(true);
    expect(isPaidStatus("past_due")).toBe(true);
  });

  it("treats free and canceled as not paid", () => {
    expect(isPaidStatus("free")).toBe(false);
    expect(isPaidStatus("canceled")).toBe(false);
  });
});

describe("getStorageQuota", () => {
  it("gives free users the free quota plus any add-on", () => {
    expect(getStorageQuota({ subscriptionStatus: "free", storageAddonBytes: 0 })).toBe(FREE_STORAGE_QUOTA_BYTES);
    expect(getStorageQuota({ subscriptionStatus: "free", storageAddonBytes: 1000 })).toBe(
      FREE_STORAGE_QUOTA_BYTES + 1000,
    );
  });

  it("gives paid users the paid quota plus any add-on", () => {
    expect(getStorageQuota({ subscriptionStatus: "active", storageAddonBytes: 0 })).toBe(PAID_STORAGE_QUOTA_BYTES);
    expect(getStorageQuota({ subscriptionStatus: "past_due", storageAddonBytes: 5000 })).toBe(
      PAID_STORAGE_QUOTA_BYTES + 5000,
    );
  });

  it("treats a canceled subscription as free tier, not paid", () => {
    expect(getStorageQuota({ subscriptionStatus: "canceled", storageAddonBytes: 0 })).toBe(FREE_STORAGE_QUOTA_BYTES);
  });
});
