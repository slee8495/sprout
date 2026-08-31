import Link from "next/link";

export const metadata = { title: "Support — Roun" };

// Public on purpose: this is the Support URL given to the App Store, so it has to answer a
// stranger's questions without a login. App Review rejected build 1.3 (3) under guideline 1.5
// because the Support URL pointed at the app itself, which is nothing but a sign-in screen to
// anyone who isn't already a member of a family (see src/proxy.ts for the public-path list).
export default function SupportPage() {
  return (
    <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 p-4 pb-24">
      <header className="pt-4">
        <h1 className="font-heading text-2xl font-bold text-brand-700 dark:text-brand-300">Roun Support</h1>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          Roun is a private journal for your family — photos, notes and videos kept for the people you
          invite, and no one else.
        </p>
      </header>

      <section className="flex flex-col gap-3 rounded-3xl border border-brand-200/70 bg-white p-5 text-sm leading-relaxed text-zinc-700 dark:border-brand-800/50 dark:bg-zinc-900 dark:text-zinc-300">
        <h2 className="font-heading text-lg font-semibold text-brand-800 dark:text-brand-200">Contact us</h2>
        <p>
          Email{" "}
          <a href="mailto:support@sl-studio.dev" className="font-semibold text-brand-700 underline dark:text-brand-300">
            support@sl-studio.dev
          </a>{" "}
          with any question, bug report, or feedback. A person reads every message, and we usually reply
          within two business days.
        </p>
        <p>
          It helps to tell us which device you&apos;re on, what you were doing, and — if something looks
          wrong — a screenshot.
        </p>
      </section>

      <section className="flex flex-col gap-5 rounded-3xl border border-brand-200/70 bg-white p-5 text-sm leading-relaxed text-zinc-700 dark:border-brand-800/50 dark:bg-zinc-900 dark:text-zinc-300">
        <h2 className="font-heading text-lg font-semibold text-brand-800 dark:text-brand-200">
          Common questions
        </h2>

        <div className="flex flex-col gap-2">
          <h3 className="font-heading font-semibold text-brand-800 dark:text-brand-200">
            How do I sign in?
          </h3>
          <p>
            Tap <em>Sign in with Apple</em> or <em>Sign in with Google</em> on the first screen. The first
            person to sign in creates the family; everyone else joins it with the family&apos;s invite code.
          </p>
        </div>

        <div className="flex flex-col gap-2">
          <h3 className="font-heading font-semibold text-brand-800 dark:text-brand-200">
            How do I invite my family?
          </h3>
          <p>
            Open Settings and share the invite code shown there. Anyone who signs in and enters that code
            joins the same journal. Family members can be set to full access or to a limited view that hides
            entries marked <em>Just us</em>.
          </p>
        </div>

        <div className="flex flex-col gap-2">
          <h3 className="font-heading font-semibold text-brand-800 dark:text-brand-200">
            Can I add an old photo to the right date?
          </h3>
          <p>
            Yes. When you attach photos, each one shows the day it was taken, and a button offers to move the
            entry to that date — so a throwback lands where it belongs instead of on today.
          </p>
        </div>

        <div className="flex flex-col gap-2">
          <h3 className="font-heading font-semibold text-brand-800 dark:text-brand-200">
            A photo or video won&apos;t upload
          </h3>
          <p>
            Check your connection and try again — Roun retries through a second route automatically when the
            first one fails. If it keeps failing, email us with the exact message you see on screen.
          </p>
        </div>

        <div className="flex flex-col gap-2">
          <h3 className="font-heading font-semibold text-brand-800 dark:text-brand-200">
            Who can see my journal?
          </h3>
          <p>
            Only the family members you invite. There is no public feed, no sharing with other users, and
            nothing in Roun is discoverable by anyone outside your family. See our{" "}
            <Link href="/privacy" className="font-semibold text-brand-700 underline dark:text-brand-300">
              Privacy Policy
            </Link>{" "}
            for what we store and why.
          </p>
        </div>

        <div className="flex flex-col gap-2">
          <h3 className="font-heading font-semibold text-brand-800 dark:text-brand-200">
            Questions about your plan or a payment
          </h3>
          <p>Email us and we&apos;ll sort it out with you directly.</p>
        </div>

        <div className="flex flex-col gap-2">
          <h3 className="font-heading font-semibold text-brand-800 dark:text-brand-200">
            How do I delete my account?
          </h3>
          <p>
            Settings has a Danger zone that deletes the whole family&apos;s journal permanently. Full details,
            including how to request deletion without signing in, are on the{" "}
            <Link href="/account-deletion" className="font-semibold text-brand-700 underline dark:text-brand-300">
              account deletion page
            </Link>
            .
          </p>
        </div>
      </section>

      <p className="text-center text-sm text-zinc-600 dark:text-zinc-400">
        <Link href="/privacy" className="font-semibold text-brand-700 dark:text-brand-300">
          Privacy Policy
        </Link>{" "}
        ·{" "}
        <Link href="/terms" className="font-semibold text-brand-700 dark:text-brand-300">
          Terms of Service
        </Link>{" "}
        ·{" "}
        <Link href="/account-deletion" className="font-semibold text-brand-700 dark:text-brand-300">
          Delete your account
        </Link>
      </p>
    </div>
  );
}
