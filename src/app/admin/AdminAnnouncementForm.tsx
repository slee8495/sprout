"use client";

import { useEffect, useState, useTransition } from "react";
import { countAnnouncementRecipients, sendAnnouncement } from "./actions";

export function AdminAnnouncementForm() {
  const [recipientCount, setRecipientCount] = useState<number | null>(null);
  const [subject, setSubject] = useState("");
  const [heading, setHeading] = useState("");
  const [body, setBody] = useState("");
  const [ctaLabel, setCtaLabel] = useState("");
  const [ctaHref, setCtaHref] = useState("");
  const [confirming, setConfirming] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    countAnnouncementRecipients().then(setRecipientCount);
  }, []);

  const canSend = subject.trim() && heading.trim() && body.trim();

  function handleSend() {
    startTransition(async () => {
      const { sent } = await sendAnnouncement({
        subject: subject.trim(),
        heading: heading.trim(),
        body: body.trim(),
        ctaLabel: ctaLabel.trim() || undefined,
        ctaHref: ctaHref.trim() || undefined,
      });
      setResult(`Sent to ${sent} ${sent === 1 ? "person" : "people"}.`);
      setConfirming(false);
      setSubject("");
      setHeading("");
      setBody("");
      setCtaLabel("");
      setCtaHref("");
    });
  }

  return (
    <div className="flex flex-col gap-3 rounded-3xl border border-brand-100/60 bg-white p-4 shadow-sm dark:border-brand-900/40 dark:bg-zinc-900">
      <div>
        <p className="font-heading font-semibold">📣 Send an announcement</p>
        <p className="text-xs text-zinc-500 dark:text-zinc-400">
          One email to every registered user{recipientCount !== null ? ` (${recipientCount} right now)` : ""}. There&apos;s
          no unsubscribe list yet, so use this only for things every user should hear about.
        </p>
      </div>

      <input
        type="text"
        placeholder="Subject line"
        value={subject}
        onChange={(e) => setSubject(e.target.value)}
        className="rounded-xl border border-zinc-200 bg-transparent px-3 py-2 text-sm dark:border-zinc-700"
      />
      <input
        type="text"
        placeholder="Heading (e.g. Great news — we're in the App Store!)"
        value={heading}
        onChange={(e) => setHeading(e.target.value)}
        className="rounded-xl border border-zinc-200 bg-transparent px-3 py-2 text-sm dark:border-zinc-700"
      />
      <textarea
        placeholder="Body — one paragraph per line"
        value={body}
        onChange={(e) => setBody(e.target.value)}
        rows={4}
        className="rounded-xl border border-zinc-200 bg-transparent px-3 py-2 text-sm dark:border-zinc-700"
      />
      <div className="flex gap-2">
        <input
          type="text"
          placeholder="Button label (optional)"
          value={ctaLabel}
          onChange={(e) => setCtaLabel(e.target.value)}
          className="w-1/2 rounded-xl border border-zinc-200 bg-transparent px-3 py-2 text-sm dark:border-zinc-700"
        />
        <input
          type="url"
          placeholder="Button link (optional)"
          value={ctaHref}
          onChange={(e) => setCtaHref(e.target.value)}
          className="w-1/2 rounded-xl border border-zinc-200 bg-transparent px-3 py-2 text-sm dark:border-zinc-700"
        />
      </div>

      {!confirming ? (
        <button
          type="button"
          disabled={!canSend}
          onClick={() => setConfirming(true)}
          className="self-start rounded-full bg-brand-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-40"
        >
          Review &amp; send
        </button>
      ) : (
        <div className="flex flex-col gap-2 rounded-xl border border-amber-300 bg-amber-50 p-3 text-sm dark:border-amber-800 dark:bg-amber-950/40">
          <p className="font-semibold text-amber-900 dark:text-amber-200">
            Send &quot;{subject}&quot; to {recipientCount ?? "…"} {recipientCount === 1 ? "person" : "people"} now? This
            can&apos;t be undone.
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              disabled={isPending}
              onClick={handleSend}
              className="rounded-full bg-amber-600 px-4 py-2 text-xs font-semibold text-white disabled:opacity-50"
            >
              {isPending ? "Sending…" : "Yes, send it"}
            </button>
            <button
              type="button"
              disabled={isPending}
              onClick={() => setConfirming(false)}
              className="rounded-full border border-zinc-300 px-4 py-2 text-xs font-semibold dark:border-zinc-600"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {result && <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">{result}</p>}
    </div>
  );
}
