"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { auth } from "@/auth";
import { isAdmin } from "@/lib/admin";
import { revokeComplimentaryAccess, setComplimentaryAccess } from "@/db/queries";

async function requireAdmin() {
  const session = await auth();
  if (!isAdmin(session?.user?.email)) redirect("/");
}

const grantSchema = z.object({
  familyId: z.number(),
  days: z.number().nullable(),
});

export async function grantAccess(input: z.infer<typeof grantSchema>) {
  await requireAdmin();
  const parsed = grantSchema.parse(input);
  const expiresAt = parsed.days ? new Date(Date.now() + parsed.days * 24 * 60 * 60 * 1000) : null;
  await setComplimentaryAccess(parsed.familyId, expiresAt);
  revalidatePath("/admin");
}

export async function revokeAccess(familyId: number) {
  await requireAdmin();
  await revokeComplimentaryAccess(familyId);
  revalidatePath("/admin");
}
