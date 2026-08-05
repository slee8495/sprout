"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { auth, unstable_update } from "@/auth";
import { getFamilyByInviteCode, isUniqueConstraintError, linkOrJoinFamilyMember } from "@/db/queries";

const joinSchema = z.object({
  familyCode: z.string().trim().min(1, "Family code is required.").max(16),
  name: z.string().trim().min(1, "Your name is required.").max(128),
});

export async function join(_prevState: string | undefined, formData: FormData) {
  const session = await auth();
  if (!session?.user?.email) redirect("/login");
  if (session.user.familyId) redirect("/");

  const parsed = joinSchema.safeParse({
    familyCode: formData.get("familyCode"),
    name: formData.get("name"),
  });
  if (!parsed.success) return parsed.error.issues[0]?.message ?? "Invalid input.";

  const familyCode = parsed.data.familyCode.toUpperCase();
  const family = await getFamilyByInviteCode(familyCode);
  if (!family) return "That family code doesn't exist.";

  try {
    await linkOrJoinFamilyMember({ familyId: family.id, name: parsed.data.name, email: session.user.email });
  } catch (err) {
    if (isUniqueConstraintError(err, "email")) return "That Google account is already linked to a family.";
    throw err;
  }

  await unstable_update({});
  redirect("/");
}
