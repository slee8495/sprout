"use client";

import { useState } from "react";
import { useSettings } from "./SettingsProvider";

export function InviteCodeCard({ inviteCode }: { inviteCode: string }) {
  const { t } = useSettings();
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    await navigator.clipboard.writeText(inviteCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <section className="flex flex-col gap-2 rounded-3xl border border-brand-200/70 bg-brand-50/60 p-4 dark:border-brand-800/50 dark:bg-brand-950/30">
      <h2 className="font-heading text-sm font-semibold text-brand-800 dark:text-brand-200">
        {t("Invite your partner")}
      </h2>
      <p className="text-xs text-zinc-600 dark:text-zinc-400">
        {t("Share this family code — they can sign in with Google and join at")} <code>/join</code>.
      </p>
      <div className="flex items-center gap-2">
        <code className="flex-1 rounded-2xl border border-brand-100 bg-white px-3 py-2 text-center font-heading text-lg font-bold tracking-widest text-brand-800 dark:border-brand-900/40 dark:bg-zinc-900 dark:text-brand-200">
          {inviteCode}
        </code>
        <button
          type="button"
          onClick={handleCopy}
          className="rounded-full bg-brand-600 px-4 py-2 font-heading text-sm font-semibold text-white shadow-sm shadow-brand-900/20 transition-transform hover:scale-105 hover:bg-brand-700 active:scale-95"
        >
          {copied ? t("Copied!") : t("Copy")}
        </button>
      </div>
    </section>
  );
}
