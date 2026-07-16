"use server";

import { AuthError } from "next-auth";
import { signIn } from "@/auth";

export async function login(_prevState: string | undefined, formData: FormData) {
  try {
    await signIn("credentials", {
      name: formData.get("name"),
      passphrase: formData.get("passphrase"),
      redirectTo: "/",
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return "That name/passphrase combination didn't work.";
    }
    throw error;
  }
}
