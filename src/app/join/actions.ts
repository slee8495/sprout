"use server";

import { AuthError } from "next-auth";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { signIn } from "@/auth";
import { addFamilyMember, getFamilyByInviteCode, getFamilyMemberByName, isUniqueConstraintError } from "@/db/queries";

const joinSchema = z.object({
  familyCode: z.string().trim().min(1, "Family code is required.").max(16),
  name: z.string().trim().min(1, "Your name is required.").max(128),
  passphrase: z.string().min(1, "Passphrase is required."),
});

function slugify(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-+|-+$)/g, "") || "member";
}

export async function join(_prevState: string | undefined, formData: FormData) {
  const parsed = joinSchema.safeParse({
    familyCode: formData.get("familyCode"),
    name: formData.get("name"),
    passphrase: formData.get("passphrase"),
  });
  if (!parsed.success) return parsed.error.issues[0]?.message ?? "Invalid input.";

  const { name, passphrase } = parsed.data;
  const familyCode = parsed.data.familyCode.toUpperCase();

  const family = await getFamilyByInviteCode(familyCode);
  if (!family) return "That family code doesn't exist.";

  const validPassphrase = await bcrypt.compare(passphrase, family.passphraseHash);
  if (!validPassphrase) return "That passphrase doesn't match.";

  const existing = await getFamilyMemberByName(family.id, name);
  if (existing) return "Someone in this family already uses that name — try a different name.";

  try {
    await addFamilyMember({
      familyId: family.id,
      name,
      email: `${slugify(name)}+f${family.id}@family.sprout.local`,
    });
  } catch (err) {
    if (isUniqueConstraintError(err, "email")) return "That name is already taken in this family — try a different name.";
    throw err;
  }

  try {
    await signIn("credentials", { familyCode, name, passphrase, redirectTo: "/" });
  } catch (error) {
    if (error instanceof AuthError) return "Joined, but sign-in failed — try logging in.";
    throw error;
  }
}
