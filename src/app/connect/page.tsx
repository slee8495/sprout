import Link from "next/link";
import { redirect } from "next/navigation";
import { auth, signOut } from "@/auth";
import { T } from "../T";

export default async function ConnectPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (session.user.familyId) redirect("/");

  return (
    <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center gap-4 p-6">
      <h1 className="font-heading text-3xl font-bold text-emerald-700 dark:text-emerald-300">🌱 Sprout</h1>
      <p className="text-sm text-zinc-600 dark:text-zinc-400">
        <T>Signed in as</T> {session.user.email}. <T>Create a new family journal or join one with an invite code.</T>
      </p>
      <div className="flex flex-col gap-3 rounded-3xl border border-emerald-200/70 bg-white p-5 shadow-md shadow-emerald-900/5 dark:border-emerald-800/50 dark:bg-zinc-900 dark:shadow-black/40">
        <Link
          href="/signup"
          className="rounded-full bg-emerald-600 px-4 py-2 text-center font-heading font-semibold text-white shadow-sm shadow-emerald-900/20 transition-transform hover:scale-105 hover:bg-emerald-700 active:scale-95"
        >
          <T>Create a family</T>
        </Link>
        <Link
          href="/join"
          className="rounded-full border border-emerald-600 px-4 py-2 text-center font-heading font-semibold text-emerald-700 transition-transform hover:scale-105 active:scale-95 dark:text-emerald-300"
        >
          <T>Join with an invite code</T>
        </Link>
      </div>
      <form
        action={async () => {
          "use server";
          await signOut({ redirectTo: "/login" });
        }}
        className="text-center"
      >
        <button type="submit" className="text-sm text-zinc-500 underline dark:text-zinc-400">
          <T>Sign in with a different account</T>
        </button>
      </form>
    </main>
  );
}
