import Link from "next/link";

export const metadata = { title: "Terms of Service — Roun" };

export default function TermsPage() {
  return (
    <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 p-4 pb-24">
      <header className="pt-4">
        <h1 className="font-heading text-2xl font-bold text-brand-700 dark:text-brand-300">Terms of Service</h1>
        <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">Last updated: August 6, 2026</p>
      </header>

      <div className="flex flex-col gap-5 rounded-3xl border border-brand-200/70 bg-white p-5 text-sm leading-relaxed text-zinc-700 dark:border-brand-800/50 dark:bg-zinc-900 dark:text-zinc-300">
        <p>
          These terms cover your use of Roun. By signing in and using the app, you agree to them. If you don&apos;t
          agree, please don&apos;t use Roun.
        </p>

        <section className="flex flex-col gap-2">
          <h2 className="font-heading font-semibold text-brand-800 dark:text-brand-200">Your account and family</h2>
          <p>
            You sign in with your Google account. A &quot;family&quot; is a private group created by one person and
            joined by others using an invite code. Keep your invite code to people you trust — anyone with it can
            join your family and see your journal entries.
          </p>
        </section>

        <section className="flex flex-col gap-2">
          <h2 className="font-heading font-semibold text-brand-800 dark:text-brand-200">Your content</h2>
          <p>
            You own everything you write, upload, or record in Roun. You&apos;re responsible for what you post —
            don&apos;t upload anything you don&apos;t have the right to share, or anything illegal or abusive. We
            only use your content to provide the service back to your family.
          </p>
        </section>

        <section className="flex flex-col gap-2">
          <h2 className="font-heading font-semibold text-brand-800 dark:text-brand-200">Beta service, no warranty</h2>
          <p>
            Roun is an early-stage, actively-developed product. We do our best to keep your data safe and the app
            running, but we provide it &quot;as is,&quot; without guarantees of uptime or that it&apos;s free of
            bugs. Please keep your own copies of anything irreplaceable (photos especially) until the service has a
            longer track record.
          </p>
        </section>

        <section className="flex flex-col gap-2">
          <h2 className="font-heading font-semibold text-brand-800 dark:text-brand-200">Subscriptions and billing</h2>
          <p>
            Roun offers a free plan and a paid Pro subscription. Where a paid plan is available to you, the
            price is shown before you pay. Payments are processed by Stripe — we never see or store your
            card details.
          </p>
          <p>
            Pro subscriptions renew automatically each month until you cancel. You can cancel anytime;
            your Pro access continues until the end of the billing period you&apos;ve already paid for, then your
            family moves to the Free plan. Moving to the Free plan never deletes anything — every entry, photo,
            voice memo, and video you&apos;ve already saved stays exactly as it is and remains visible. On the Free
            plan you just can&apos;t add a new child or pet beyond your first one, or upload new photos or videos
            once you&apos;re over the free storage limit, until you resubscribe.
          </p>
          <p>
            The storage add-on is a one-time purchase that permanently increases your family&apos;s storage limit —
            it isn&apos;t a subscription and doesn&apos;t need to be renewed.
          </p>
          <p>
            Charges are generally non-refundable, including partial subscription periods and storage add-on
            purchases, except where required by law or at our discretion. If something went wrong with a charge,
            email{" "}
            <a href="mailto:support@sl-studio.dev" className="text-brand-700 underline dark:text-brand-300">
              support@sl-studio.dev
            </a>{" "}
            and we&apos;ll take a look. We&apos;ll give notice in the app before any price change takes effect for
            existing subscribers. Some families may be granted free access at our discretion.
          </p>
        </section>

        <section className="flex flex-col gap-2">
          <h2 className="font-heading font-semibold text-brand-800 dark:text-brand-200">Ending your account</h2>
          <p>
            You can permanently delete your family&apos;s account and all associated data yourself, anytime, from
            the Danger Zone in Settings — this also cancels any active subscription. We may suspend or end access
            for accounts that abuse the service or violate these terms. If you&apos;d rather we handle a deletion
            for you, email{" "}
            <a href="mailto:support@sl-studio.dev" className="text-brand-700 underline dark:text-brand-300">
              support@sl-studio.dev
            </a>
            .
          </p>
        </section>

        <section className="flex flex-col gap-2">
          <h2 className="font-heading font-semibold text-brand-800 dark:text-brand-200">Limitation of liability</h2>
          <p>
            To the extent permitted by law, Roun is not liable for indirect, incidental, or consequential damages
            arising from your use of the service, including loss of data.
          </p>
        </section>

        <section className="flex flex-col gap-2">
          <h2 className="font-heading font-semibold text-brand-800 dark:text-brand-200">Changes to these terms</h2>
          <p>
            We may update these terms as Roun evolves. We&apos;ll update the date at the top of this page when we
            do. Continued use after a change means you accept the update.
          </p>
        </section>

        <section className="flex flex-col gap-2">
          <h2 className="font-heading font-semibold text-brand-800 dark:text-brand-200">Contact</h2>
          <p>
            Questions about these terms? Reach us at{" "}
            <a href="mailto:support@sl-studio.dev" className="text-brand-700 underline dark:text-brand-300">
              support@sl-studio.dev
            </a>
            .
          </p>
        </section>
      </div>

      <p className="text-center text-sm text-zinc-600 dark:text-zinc-400">
        Also see our{" "}
        <Link href="/privacy" className="font-semibold text-brand-700 dark:text-brand-300">
          Privacy Policy
        </Link>
        .
      </p>
    </div>
  );
}
