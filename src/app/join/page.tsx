import Link from "next/link";
import { JoinForm } from "./JoinForm";

export default function JoinPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center gap-4 p-6">
      <h1 className="font-heading text-3xl font-bold text-emerald-700 dark:text-emerald-300">🌱 Sprout</h1>
      <p className="text-sm text-zinc-600 dark:text-zinc-400">
        Join your partner&apos;s family with the code and passphrase they shared with you.
      </p>
      <JoinForm />
      <p className="text-center text-sm text-zinc-600 dark:text-zinc-400">
        Starting a new family?{" "}
        <Link href="/signup" className="font-semibold text-emerald-700 dark:text-emerald-300">
          Sign up
        </Link>
        .
      </p>
    </main>
  );
}
