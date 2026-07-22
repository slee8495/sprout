"use server";

import { AuthError } from "next-auth";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { signIn } from "@/auth";
import { createFamilyWithOwner, isUniqueConstraintError } from "@/db/queries";

const signupSchema = z.object({
  familyName: z.string().trim().min(1, "Family name is required.").max(128),
  ownerName: z.string().trim().min(1, "Your name is required.").max(128),
  email: z.string().trim().min(1, "Email is required.").email("Enter a valid email."),
  passphrase: z.string().min(6, "Passphrase must be at least 6 characters."),
});

export async function signup(_prevState: string | undefined, formData: FormData) {
  const parsed = signupSchema.safeParse({
    familyName: formData.get("familyName"),
    ownerName: formData.get("ownerName"),
    email: formData.get("email"),
    passphrase: formData.get("passphrase"),
  });
  if (!parsed.success) return parsed.error.issues[0]?.message ?? "Invalid input.";

  const { familyName, ownerName, email, passphrase } = parsed.data;

  let inviteCode: string;
  try {
    const passphraseHash = await bcrypt.hash(passphrase, 12);
    const { family } = await createFamilyWithOwner({ familyName, ownerName, email, passphraseHash });
    inviteCode = family.inviteCode;
  } catch (err) {
    if (isUniqueConstraintError(err, "email")) return "That email is already registered.";
    throw err;
  }

  try {
    await signIn("credentials", {
      familyCode: inviteCode,
      name: ownerName,
      passphrase,
      redirectTo: "/onboarding",
    });
  } catch (error) {
    if (error instanceof AuthError) return "Account created, but sign-in failed — try logging in.";
    throw error;
  }
}
