import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { isAdmin } from "@/lib/admin";
import { listAllFamiliesForAdmin } from "@/db/queries";
import { AdminFamilyList } from "./AdminFamilyList";

export default async function AdminPage() {
  const session = await auth();
  if (!isAdmin(session?.user?.email)) redirect("/");

  const families = await listAllFamiliesForAdmin();

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 p-4 pb-24">
      <header className="pt-4">
        <h1 className="font-heading text-2xl font-bold text-emerald-700 dark:text-emerald-300">🔑 Admin</h1>
        <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
          Grant or revoke complimentary Pro access. This never touches a family&apos;s real Stripe subscription.
        </p>
      </header>
      <AdminFamilyList families={families} />
    </div>
  );
}
