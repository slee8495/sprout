import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { isAppleSignInConfigured } from "@/lib/appleClientSecret";
import { T } from "../T";
import { AppleSignInButton } from "./AppleSignInButton";
import { GoogleSignInButton } from "./GoogleSignInButton";

export default async function LoginPage() {
  const session = await auth();
  if (session?.user?.familyId) redirect("/");
  if (session?.user) redirect("/connect");

  return (
    <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center gap-4 p-6">
      <h1 className="font-heading text-3xl font-bold text-brand-700 dark:text-brand-300">🌱 Roun</h1>
      <p className="text-sm text-zinc-600 dark:text-zinc-400">
        <T>Your family&apos;s private journal.</T>
      </p>
      <div className="flex flex-col gap-3 rounded-3xl border border-brand-200/70 bg-white p-5 shadow-md shadow-brand-900/5 dark:border-brand-800/50 dark:bg-zinc-900 dark:shadow-black/40">
        <GoogleSignInButton />
        {isAppleSignInConfigured() && <AppleSignInButton />}
      </div>
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
