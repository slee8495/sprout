import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { T } from "../T";
import { SignupForm } from "./SignupForm";

export default async function SignupPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (session.user.familyId) redirect("/");

  return (
    <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center gap-4 p-6">
      <h1 className="font-heading text-3xl font-bold text-brand-700 dark:text-brand-300">🌱 Roun</h1>
      <p className="text-sm text-zinc-600 dark:text-zinc-400">
        <T>Create your family&apos;s private journal.</T>
      </p>
      <SignupForm defaultName={session.user.name ?? ""} />
      <p className="text-center text-sm text-zinc-600 dark:text-zinc-400">
        <T>Joining an existing family?</T>{" "}
        <Link href="/join" className="font-semibold text-brand-700 dark:text-brand-300">
          <T>Use an invite code</T>
        </Link>
        .
      </p>
    </main>
  );
}
