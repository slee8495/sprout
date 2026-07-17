"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createTimeCapsule } from "@/db/queries";
import { requireSession } from "@/lib/session";

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

const capsuleSchema = z.object({
  unlockDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  title: z.string().max(256).optional(),
  body: z.string().min(1).max(10000),
});

export async function createCapsule(input: z.infer<typeof capsuleSchema>) {
  const { userId, familyId } = await requireSession();
  const parsed = capsuleSchema.parse(input);

  if (parsed.unlockDate <= todayISO()) {
    throw new Error("Unlock date must be in the future");
  }

  await createTimeCapsule({
    familyId,
    authorId: userId,
    unlockDate: parsed.unlockDate,
    title: parsed.title,
    body: parsed.body,
  });

  revalidatePath("/time-capsules");
}
