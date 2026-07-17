"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createGrowthMeasurement, deleteGrowthMeasurement } from "@/db/queries";
import { requireSession } from "@/lib/session";

const measurementSchema = z
  .object({
    measuredAt: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    heightCm: z.number().positive().max(300).optional(),
    weightKg: z.number().positive().max(300).optional(),
  })
  .refine((v) => v.heightCm != null || v.weightKg != null, "Enter a height or weight");

export async function addMeasurement(input: z.infer<typeof measurementSchema>) {
  const { familyId } = await requireSession();
  const parsed = measurementSchema.parse(input);

  await createGrowthMeasurement({ familyId, ...parsed });
  revalidatePath("/growth");
}

export async function removeMeasurement(id: number) {
  const { familyId } = await requireSession();
  await deleteGrowthMeasurement(id, familyId);
  revalidatePath("/growth");
}
