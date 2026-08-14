"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import {
  createChild,
  getFamilyBilling,
  listChildren,
  updateChild,
  updateFamilySettings,
  updateMemberRole,
} from "@/db/queries";
import { dayCountStartEnum, subjectTypeEnum, userRoleEnum } from "@/db/schema";
import { requireEditor, requireOwner } from "@/lib/session";
import { FREE_CHILD_LIMIT, isPaidStatus } from "@/lib/storage";

const familySettingsSchema = z.object({
  timezone: z.string().min(1),
});

export async function saveFamilySettings(input: z.infer<typeof familySettingsSchema>) {
  const { familyId } = await requireEditor();
  const parsed = familySettingsSchema.parse(input);

  await updateFamilySettings(familyId, parsed);

  revalidatePath("/");
  revalidatePath("/feed");
  revalidatePath("/milestones");
  revalidatePath("/settings");
}

const childSchema = z.object({
  name: z.string().trim().min(1, "Name is required.").max(128),
  type: z.enum(subjectTypeEnum.enumValues).default("child"),
  birthDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Pick a valid birth date."),
  dayCountStart: z.enum(dayCountStartEnum.enumValues),
});

export async function addChild(input: z.infer<typeof childSchema>) {
  const { familyId } = await requireEditor();
  const parsed = childSchema.parse(input);

  const billing = await getFamilyBilling(familyId);
  if (!isPaidStatus(billing.subscriptionStatus)) {
    const kids = await listChildren(familyId);
    if (kids.length >= FREE_CHILD_LIMIT) {
      throw new Error("Free plan is limited to 1 child or pet — upgrade to add more.");
    }
  }

  await createChild({ familyId, ...parsed });

  revalidatePath("/");
  revalidatePath("/feed");
  revalidatePath("/milestones");
  revalidatePath("/settings");
}

export async function editChild(childId: number, input: z.infer<typeof childSchema>) {
  const { familyId } = await requireEditor();
  const parsed = childSchema.parse(input);

  await updateChild(childId, familyId, parsed);

  revalidatePath("/");
  revalidatePath("/feed");
  revalidatePath("/milestones");
  revalidatePath("/settings");
}

export async function changeMemberRole(targetUserId: number, role: (typeof userRoleEnum.enumValues)[number]) {
  const { familyId, userId } = await requireOwner();
  if (targetUserId === userId) throw new Error("You can't change your own role.");

  await updateMemberRole(familyId, targetUserId, role);

  revalidatePath("/settings");
}
