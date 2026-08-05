import Link from "next/link";

export const metadata = { title: "Privacy Policy — Sprout" };

export default function PrivacyPage() {
  return (
    <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 p-4 pb-24">
      <header className="pt-4">
        <h1 className="font-heading text-2xl font-bold text-emerald-700 dark:text-emerald-300">Privacy Policy</h1>
        <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">Last updated: July 24, 2026</p>
      </header>

      <div className="flex flex-col gap-5 rounded-3xl border border-emerald-200/70 bg-white p-5 text-sm leading-relaxed text-zinc-700 dark:border-emerald-800/50 dark:bg-zinc-900 dark:text-zinc-300">
        <p>
          Sprout is a private journal for families to record their children&apos;s and pets&apos; lives. This page
          explains what information we collect, how we use it, and who we share it with.
        </p>

        <section className="flex flex-col gap-2">
          <h2 className="font-heading font-semibold text-emerald-800 dark:text-emerald-200">What we collect</h2>
          <ul className="list-disc pl-5">
            <li>Your name, email address, and profile photo from Google when you sign in.</li>
            <li>Journal entries you write, including any photos, voice memos, and comments.</li>
            <li>Basic account settings (timezone, theme, names and birth/adoption dates of the kids and pets in your family).</li>
            <li>A push-notification token, only if you enable notifications on a device.</li>
          </ul>
        </section>

        <section className="flex flex-col gap-2">
          <h2 className="font-heading font-semibold text-emerald-800 dark:text-emerald-200">How we use it</h2>
          <p>
            We use this information only to run Sprout for your family: showing your journal back to you, notifying
            family members of new entries or comments, and letting you sign in. We don&apos;t use your data for
            advertising, and we don&apos;t sell it to anyone.
          </p>
        </section>

        <section className="flex flex-col gap-2">
          <h2 className="font-heading font-semibold text-emerald-800 dark:text-emerald-200">Who can see it</h2>
          <p>
            Journal entries are only visible to members of your own family — the people who signed in with an
            invite code you shared. We can&apos;t see the content of your entries except as needed to operate,
            debug, or secure the service.
          </p>
        </section>

        <section className="flex flex-col gap-2">
          <h2 className="font-heading font-semibold text-emerald-800 dark:text-emerald-200">
            Service providers we use
          </h2>
          <ul className="list-disc pl-5">
            <li>Google — for signing in (Google OAuth).</li>
            <li>Vercel — for hosting the app and storing uploaded photos/voice memos.</li>
            <li>Neon — for our database.</li>
          </ul>
          <p>These providers only process data on our behalf and don&apos;t use it for their own purposes.</p>
        </section>

        <section className="flex flex-col gap-2">
          <h2 className="font-heading font-semibold text-emerald-800 dark:text-emerald-200">About children&apos;s (and pets&apos;) data</h2>
          <p>
            Sprout is a journal <em>about</em> children and pets, kept by their family. None of them create their own
            accounts, sign in, or provide any information directly — everything is entered by a parent or guardian
            in the family.
          </p>
        </section>

        <section className="flex flex-col gap-2">
          <h2 className="font-heading font-semibold text-emerald-800 dark:text-emerald-200">Cookies</h2>
          <p>We use a single session cookie to keep you signed in. We don&apos;t use tracking or advertising cookies.</p>
        </section>

        <section className="flex flex-col gap-2">
          <h2 className="font-heading font-semibold text-emerald-800 dark:text-emerald-200">
            Deleting your data
          </h2>
          <p>
            You can permanently delete your family&apos;s account and all associated data yourself, any time, from
            the Danger Zone in Settings. If you&apos;d rather we do it for you, email{" "}
            <a href="mailto:sanlee8495@gmail.com" className="text-emerald-700 underline dark:text-emerald-300">
              sanlee8495@gmail.com
            </a>
            .
          </p>
        </section>

        <section className="flex flex-col gap-2">
          <h2 className="font-heading font-semibold text-emerald-800 dark:text-emerald-200">Changes to this policy</h2>
          <p>
            If this policy changes in a meaningful way, we&apos;ll update the date at the top of this page. Continued
            use of Sprout after a change means you accept the update.
          </p>
        </section>

        <section className="flex flex-col gap-2">
          <h2 className="font-heading font-semibold text-emerald-800 dark:text-emerald-200">Contact</h2>
          <p>
            Questions about this policy? Reach us at{" "}
            <a href="mailto:sanlee8495@gmail.com" className="text-emerald-700 underline dark:text-emerald-300">
              sanlee8495@gmail.com
            </a>
            .
          </p>
        </section>
      </div>

      <p className="text-center text-sm text-zinc-600 dark:text-zinc-400">
        Also see our{" "}
        <Link href="/terms" className="font-semibold text-emerald-700 dark:text-emerald-300">
          Terms of Service
        </Link>
        .
      </p>
    </div>
  );
}
