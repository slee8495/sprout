import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { T } from "../T";
import { JoinForm } from "./JoinForm";

export default async function JoinPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (session.user.familyId) redirect("/");

  return (
    <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center gap-4 p-6">
      <h1 className="font-heading text-3xl font-bold text-emerald-700 dark:text-emerald-300">🌱 Sprout</h1>
      <p className="text-sm text-zinc-600 dark:text-zinc-400">
        <T>Join your family&apos;s journal with the invite code they shared with you.</T>
      </p>
      <JoinForm defaultName={session.user.name ?? ""} />
      <p className="text-center text-sm text-zinc-600 dark:text-zinc-400">
        <T>Starting a new family?</T>{" "}
        <Link href="/signup" className="font-semibold text-emerald-700 dark:text-emerald-300">
          <T>Create one</T>
        </Link>
        .
      </p>
    </main>
  );
}
