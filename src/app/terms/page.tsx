import Link from "next/link";

export const metadata = { title: "Terms of Service — Sprout" };

export default function TermsPage() {
  return (
    <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 p-4 pb-24">
      <header className="pt-4">
        <h1 className="font-heading text-2xl font-bold text-emerald-700 dark:text-emerald-300">Terms of Service</h1>
        <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">Last updated: July 24, 2026</p>
      </header>

      <div className="flex flex-col gap-5 rounded-3xl border border-emerald-200/70 bg-white p-5 text-sm leading-relaxed text-zinc-700 dark:border-emerald-800/50 dark:bg-zinc-900 dark:text-zinc-300">
        <p>
          These terms cover your use of Sprout. By signing in and using the app, you agree to them. If you don&apos;t
          agree, please don&apos;t use Sprout.
        </p>

        <section className="flex flex-col gap-2">
          <h2 className="font-heading font-semibold text-emerald-800 dark:text-emerald-200">Your account and family</h2>
          <p>
            You sign in with your Google account. A &quot;family&quot; is a private group created by one person and
            joined by others using an invite code. Keep your invite code and passphrase to people you trust — anyone
            with it can join your family and see your journal entries.
          </p>
        </section>

        <section className="flex flex-col gap-2">
          <h2 className="font-heading font-semibold text-emerald-800 dark:text-emerald-200">Your content</h2>
          <p>
            You own everything you write, upload, or record in Sprout. You&apos;re responsible for what you post —
            don&apos;t upload anything you don&apos;t have the right to share, or anything illegal or abusive. We
            only use your content to provide the service back to your family.
          </p>
        </section>

        <section className="flex flex-col gap-2">
          <h2 className="font-heading font-semibold text-emerald-800 dark:text-emerald-200">Beta service, no warranty</h2>
          <p>
            Sprout is an early-stage, actively-developed product. We do our best to keep your data safe and the app
            running, but we provide it &quot;as is,&quot; without guarantees of uptime or that it&apos;s free of
            bugs. Please keep your own copies of anything irreplaceable (photos especially) until the service has a
            longer track record.
          </p>
        </section>

        <section className="flex flex-col gap-2">
          <h2 className="font-heading font-semibold text-emerald-800 dark:text-emerald-200">Subscriptions</h2>
          <p>
            Some features may require a paid subscription. If so, pricing and billing terms will be shown before you
            pay, and you can cancel at any time. Some families may be granted free access at our discretion.
          </p>
        </section>

        <section className="flex flex-col gap-2">
          <h2 className="font-heading font-semibold text-emerald-800 dark:text-emerald-200">Ending your account</h2>
          <p>
            You can stop using Sprout at any time. We may suspend or end access for accounts that abuse the service
            or violate these terms. Email{" "}
            <a href="mailto:support@sl-studio.dev" className="text-emerald-700 underline dark:text-emerald-300">
              support@sl-studio.dev
            </a>{" "}
            to close your account or request your data be deleted.
          </p>
        </section>

        <section className="flex flex-col gap-2">
          <h2 className="font-heading font-semibold text-emerald-800 dark:text-emerald-200">Limitation of liability</h2>
          <p>
            To the extent permitted by law, Sprout is not liable for indirect, incidental, or consequential damages
            arising from your use of the service, including loss of data.
          </p>
        </section>

        <section className="flex flex-col gap-2">
          <h2 className="font-heading font-semibold text-emerald-800 dark:text-emerald-200">Changes to these terms</h2>
          <p>
            We may update these terms as Sprout evolves. We&apos;ll update the date at the top of this page when we
            do. Continued use after a change means you accept the update.
          </p>
        </section>

        <section className="flex flex-col gap-2">
          <h2 className="font-heading font-semibold text-emerald-800 dark:text-emerald-200">Contact</h2>
          <p>
            Questions about these terms? Reach us at{" "}
            <a href="mailto:support@sl-studio.dev" className="text-emerald-700 underline dark:text-emerald-300">
              support@sl-studio.dev
            </a>
            .
          </p>
        </section>
      </div>

      <p className="text-center text-sm text-zinc-600 dark:text-zinc-400">
        Also see our{" "}
        <Link href="/privacy" className="font-semibold text-emerald-700 dark:text-emerald-300">
          Privacy Policy
        </Link>
        .
      </p>
    </div>
  );
}
