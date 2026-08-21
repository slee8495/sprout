"use server";

import { signIn } from "@/auth";

export async function loginWithGoogle() {
  await signIn("google", { redirectTo: "/" });
}

export async function loginWithApple() {
  await signIn("apple", { redirectTo: "/" });
}
