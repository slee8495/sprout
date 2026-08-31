import Link from "next/link";

export const metadata = { title: "Delete Your Account — Roun" };

export default function AccountDeletionPage() {
  return (
    <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 p-4 pb-24">
      <header className="pt-4">
        <h1 className="font-heading text-2xl font-bold text-brand-700 dark:text-brand-300">
          Delete Your Roun Account
        </h1>
        <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">Last updated: August 10, 2026</p>
      </header>

      <div className="flex flex-col gap-5 rounded-3xl border border-brand-200/70 bg-white p-5 text-sm leading-relaxed text-zinc-700 dark:border-brand-800/50 dark:bg-zinc-900 dark:text-zinc-300">
        <p>
          In Roun, an &quot;account&quot; is your family&apos;s shared journal — every person who signed in with
          your family&apos;s invite code belongs to the same account. Deleting it removes the whole family&apos;s
          data, not just one person&apos;s.
        </p>

        <section className="flex flex-col gap-2">
          <h2 className="font-heading font-semibold text-brand-800 dark:text-brand-200">
            How to delete your account in the app
          </h2>
          <ol className="list-decimal pl-5">
            <li>Sign in to Roun and open Settings.</li>
            <li>Scroll to the &quot;Danger zone&quot; section.</li>
            <li>Type your family&apos;s name into the confirmation field.</li>
            <li>Tap &quot;Permanently delete this family&apos;s account.&quot;</li>
          </ol>
          <p>
            Deletion happens immediately — there&apos;s no waiting period and no way to undo it once confirmed.
          </p>
        </section>

        <section className="flex flex-col gap-2">
          <h2 className="font-heading font-semibold text-brand-800 dark:text-brand-200">
            Request deletion without signing in
          </h2>
          <p>
            If you can&apos;t or don&apos;t want to sign in, email{" "}
            <a href="mailto:support@sl-studio.dev" className="text-brand-700 underline dark:text-brand-300">
              support@sl-studio.dev
            </a>{" "}
            from the address associated with your family and we&apos;ll delete it for you.
          </p>
        </section>

        <section className="flex flex-col gap-2">
          <h2 className="font-heading font-semibold text-brand-800 dark:text-brand-200">
            What gets deleted
          </h2>
          <ul className="list-disc pl-5">
            <li>Every journal entry, comment, photo, and video in the family.</li>
            <li>All children and pet profiles.</li>
            <li>Every family member&apos;s login and account settings.</li>
            <li>Any push-notification subscriptions.</li>
            <li>Any active paid subscription is canceled at the same time.</li>
          </ul>
          <p>All of this is deleted permanently and cannot be recovered.</p>
        </section>
      </div>

      <p className="text-center text-sm text-zinc-600 dark:text-zinc-400">
        See also our{" "}
        <Link href="/privacy" className="font-semibold text-brand-700 dark:text-brand-300">
          Privacy Policy
        </Link>{" "}
        and{" "}
        <Link href="/terms" className="font-semibold text-brand-700 dark:text-brand-300">
          Terms of Service
        </Link>
        .
      </p>
    </div>
  );
}
