import { afterAll, beforeAll, describe, expect, it } from "vitest";
import {
  createFamilyWithOwner,
  createJournalEntry,
  deleteFamilyAccount,
  getFamilyBilling,
  getFamilyStorageUsage,
  incrementStorageAddon,
  linkOrJoinFamilyMember,
  listJournalEntries,
  updateFamilyBilling,
} from "./queries";

// Hits the real shared Neon database (see vitest.integration.config.ts for why this
// is kept out of `npm test`). Every row created here is tagged with a random suffix
// and torn down in afterAll via the same deleteFamilyAccount() path the real
// self-service deletion feature uses — never touches the real family's data.
describe("core flows against a disposable test family", () => {
  const suffix = Math.random().toString(36).slice(2, 10);
  const familyName = `TEST_FAMILY_${suffix}`;
  let familyId: number;
  let ownerId: number;

  beforeAll(async () => {
    const { family, user } = await createFamilyWithOwner({
      familyName,
      ownerName: "TestOwner",
      email: `test-owner-${suffix}@example.invalid`,
    });
    familyId = family.id;
    ownerId = user.id;
  });

  afterAll(async () => {
    await deleteFamilyAccount(familyId);
  });

  it("creates a family with its owner as the first user", () => {
    expect(familyId).toBeGreaterThan(0);
    expect(ownerId).toBeGreaterThan(0);
  });

  it("links a new Google email to an existing member matched by name, without creating a duplicate user", async () => {
    const linked = await linkOrJoinFamilyMember({
      familyId,
      name: "TestOwner",
      email: `relinked-${suffix}@example.invalid`,
    });
    expect(linked.id).toBe(ownerId);
    expect(linked.email).toBe(`relinked-${suffix}@example.invalid`);
  });

  it("creates a new member when the name doesn't match an existing one", async () => {
    const joined = await linkOrJoinFamilyMember({
      familyId,
      name: "TestPartner",
      email: `partner-${suffix}@example.invalid`,
    });
    expect(joined.id).not.toBe(ownerId);
    expect(joined.name).toBe("TestPartner");
  });

  it("writes a journal entry and reads it back", async () => {
    const entry = await createJournalEntry({
      familyId,
      authorId: ownerId,
      audience: "parents",
      entryDate: "2026-08-05",
      title: "Integration test entry",
      body: "This entry was written by the automated test suite.",
    });
    expect(entry.id).toBeGreaterThan(0);

    const entries = await listJournalEntries(familyId);
    const found = entries.find((e) => e.id === entry.id);
    expect(found).toBeDefined();
    expect(found?.body).toBe("This entry was written by the automated test suite.");
    expect(found?.title).toBe("Integration test entry");
  });

  it("excludes drafts from the published entry list", async () => {
    const draft = await createJournalEntry({
      familyId,
      authorId: ownerId,
      audience: "parents",
      entryDate: "2026-08-05",
      body: "This is a draft and should not appear in the published list.",
      isDraft: true,
    });

    const entries = await listJournalEntries(familyId);
    expect(entries.find((e) => e.id === draft.id)).toBeUndefined();
  });

  it("defaults a new family to the free plan with no storage add-on", async () => {
    const billing = await getFamilyBilling(familyId);
    expect(billing.subscriptionStatus).toBe("free");
    expect(billing.storageAddonBytes).toBe(0);
  });

  it("reflects a simulated Stripe webhook update to an active subscription", async () => {
    await updateFamilyBilling(familyId, { subscriptionStatus: "active", stripeCustomerId: `cus_test_${suffix}` });
    const billing = await getFamilyBilling(familyId);
    expect(billing.subscriptionStatus).toBe("active");
    expect(billing.stripeCustomerId).toBe(`cus_test_${suffix}`);
  });

  it("atomically increments the storage add-on", async () => {
    await incrementStorageAddon(familyId, 5 * 1024 * 1024 * 1024);
    const billing = await getFamilyBilling(familyId);
    expect(billing.storageAddonBytes).toBe(5 * 1024 * 1024 * 1024);
  });

  it("stores a video's URL and size on the entry, and counts it toward storage usage", async () => {
    const usageBefore = await getFamilyStorageUsage(familyId);

    const entry = await createJournalEntry({
      familyId,
      authorId: ownerId,
      audience: "parents",
      entryDate: "2026-08-05",
      body: "Entry with a video attached.",
      videoUrl: "https://example-blob.invalid/videos/test.mp4",
      videoSizeBytes: 12_345_678,
    });

    const entries = await listJournalEntries(familyId);
    const found = entries.find((e) => e.id === entry.id);
    expect(found?.videoUrl).toBe("https://example-blob.invalid/videos/test.mp4");

    const usageAfter = await getFamilyStorageUsage(familyId);
    expect(usageAfter - usageBefore).toBe(12_345_678);
  });
});
