"use client";

import { useState } from "react";

export function InviteCodeCard({ inviteCode }: { inviteCode: string }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    await navigator.clipboard.writeText(inviteCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <section className="flex flex-col gap-2 rounded-3xl border border-emerald-200/70 bg-emerald-50/60 p-4 dark:border-emerald-800/50 dark:bg-emerald-950/30">
      <h2 className="font-heading text-sm font-semibold text-emerald-800 dark:text-emerald-200">
        Invite your partner
      </h2>
      <p className="text-xs text-zinc-600 dark:text-zinc-400">
        Share this family code and your passphrase — they can join at <code>/join</code>.
      </p>
      <div className="flex items-center gap-2">
        <code className="flex-1 rounded-2xl border border-emerald-100 bg-white px-3 py-2 text-center font-heading text-lg font-bold tracking-widest text-emerald-800 dark:border-emerald-900/40 dark:bg-zinc-900 dark:text-emerald-200">
          {inviteCode}
        </code>
        <button
          type="button"
          onClick={handleCopy}
          className="rounded-full bg-emerald-600 px-4 py-2 font-heading text-sm font-semibold text-white shadow-sm shadow-emerald-900/20 transition-transform hover:scale-105 hover:bg-emerald-700 active:scale-95"
        >
          {copied ? "Copied!" : "Copy"}
        </button>
      </div>
    </section>
  );
}
