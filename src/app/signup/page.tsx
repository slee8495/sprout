import Link from "next/link";
import { SignupForm } from "./SignupForm";

export default function SignupPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center gap-4 p-6">
      <h1 className="font-heading text-3xl font-bold text-emerald-700 dark:text-emerald-300">🌱 Sprout</h1>
      <p className="text-sm text-zinc-600 dark:text-zinc-400">Create your family&apos;s private journal.</p>
      <SignupForm />
      <p className="text-center text-sm text-zinc-600 dark:text-zinc-400">
        Already have a family?{" "}
        <Link href="/login" className="font-semibold text-emerald-700 dark:text-emerald-300">
          Log in
        </Link>{" "}
        or{" "}
        <Link href="/join" className="font-semibold text-emerald-700 dark:text-emerald-300">
          join with a code
        </Link>
        .
      </p>
    </main>
  );
}
