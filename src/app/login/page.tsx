import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { T } from "../T";
import { loginWithGoogle } from "./actions";

export default async function LoginPage() {
  const session = await auth();
  if (session?.user?.familyId) redirect("/");
  if (session?.user) redirect("/connect");

  return (
    <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center gap-4 p-6">
      <h1 className="font-heading text-3xl font-bold text-emerald-700 dark:text-emerald-300">🌱 Sprout</h1>
      <p className="text-sm text-zinc-600 dark:text-zinc-400">
        <T>Your family&apos;s private journal.</T>
      </p>
      <form
        action={loginWithGoogle}
        className="flex flex-col gap-3 rounded-3xl border border-emerald-200/70 bg-white p-5 shadow-md shadow-emerald-900/5 dark:border-emerald-800/50 dark:bg-zinc-900 dark:shadow-black/40"
      >
        <button
          type="submit"
          className="flex items-center justify-center gap-2 rounded-full bg-emerald-600 px-4 py-2 font-heading font-semibold text-white shadow-sm shadow-emerald-900/20 transition-transform hover:scale-105 hover:bg-emerald-700 active:scale-95"
        >
          <T>Sign in with Google</T>
        </button>
      </form>
      <p className="text-center text-xs text-zinc-500 dark:text-zinc-400">
        <T>By continuing, you agree to our</T>{" "}
        <Link href="/terms" className="underline">
          <T>Terms</T>
        </Link>{" "}
        <T>and</T>{" "}
        <Link href="/privacy" className="underline">
          <T>Privacy Policy</T>
        </Link>
        .
      </p>
    </main>
  );
}
