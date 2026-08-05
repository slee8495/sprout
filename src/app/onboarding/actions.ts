"use server";

import { z } from "zod";
import { createChild, updateFamilySettings } from "@/db/queries";
import { dayCountStartEnum, subjectTypeEnum } from "@/db/schema";
import { requireSession } from "@/lib/session";

const onboardingSchema = z.object({
  timezone: z.string().min(1),
  childName: z.string().trim().min(1).max(128),
  childType: z.enum(subjectTypeEnum.enumValues).default("child"),
  birthDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  dayCountStart: z.enum(dayCountStartEnum.enumValues),
});

export async function completeOnboarding(input: z.infer<typeof onboardingSchema>) {
  const { familyId } = await requireSession();
  const parsed = onboardingSchema.parse(input);

  await updateFamilySettings(familyId, { timezone: parsed.timezone });
  await createChild({
    familyId,
    name: parsed.childName,
    type: parsed.childType,
    birthDate: parsed.birthDate,
    dayCountStart: parsed.dayCountStart,
  });
}
