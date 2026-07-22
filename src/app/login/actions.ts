"use server";

import { AuthError } from "next-auth";
import { signIn } from "@/auth";

export async function login(_prevState: string | undefined, formData: FormData) {
  try {
    await signIn("credentials", {
      familyCode: formData.get("familyCode"),
      name: formData.get("name"),
      passphrase: formData.get("passphrase"),
      redirectTo: "/",
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return "That family code, name, or passphrase didn't work.";
    }
    throw error;
  }
}
