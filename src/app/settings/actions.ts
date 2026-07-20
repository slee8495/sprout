"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { updateFamilySettings } from "@/db/queries";
import { dayCountStartEnum } from "@/db/schema";
import { requireSession } from "@/lib/session";

const familySettingsSchema = z.object({
  timezone: z.string().min(1),
  birthDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  dayCountStart: z.enum(dayCountStartEnum.enumValues),
});

export async function saveFamilySettings(input: z.infer<typeof familySettingsSchema>) {
  const { familyId } = await requireSession();
  const parsed = familySettingsSchema.parse(input);

  await updateFamilySettings(familyId, parsed);

  revalidatePath("/");
  revalidatePath("/feed");
  revalidatePath("/milestones");
  revalidatePath("/settings");
}
