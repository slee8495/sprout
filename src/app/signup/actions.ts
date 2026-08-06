"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { auth, unstable_update } from "@/auth";
import { createFamilyWithOwner, isUniqueConstraintError } from "@/db/queries";
import { sendEmail } from "@/lib/email";
import { welcomeEmail } from "@/lib/emailTemplates";
import { isRateLimited } from "@/lib/rateLimit";

async function getOrigin() {
  const host = (await headers()).get("host") ?? "localhost:3000";
  const protocol = host.startsWith("localhost") || host.startsWith("127.0.0.1") ? "http" : "https";
  return `${protocol}://${host}`;
}

const signupSchema = z.object({
  familyName: z.string().trim().min(1, "Family name is required.").max(128),
  ownerName: z.string().trim().min(1, "Your name is required.").max(128),
});

export async function signup(_prevState: string | undefined, formData: FormData) {
  const session = await auth();
  if (!session?.user?.email) redirect("/login");
  if (session.user.familyId) redirect("/");

  if (isRateLimited(`signup:${session.user.email}`, 5, 10 * 60 * 1000)) {
    return "Too many attempts — please wait a few minutes and try again.";
  }

  const parsed = signupSchema.safeParse({
    familyName: formData.get("familyName"),
    ownerName: formData.get("ownerName"),
  });
  if (!parsed.success) return parsed.error.issues[0]?.message ?? "Invalid input.";

  try {
    await createFamilyWithOwner({ ...parsed.data, email: session.user.email });
  } catch (err) {
    if (isUniqueConstraintError(err, "email")) return "That Google account is already linked to a family.";
    throw err;
  }

  const appUrl = await getOrigin();
  await sendEmail({ to: session.user.email, ...welcomeEmail({ familyName: parsed.data.familyName, appUrl }) }).catch(
    () => {}, // Best-effort — a failed welcome email shouldn't block signup.
  );

  await unstable_update({});
  redirect("/onboarding");
}
