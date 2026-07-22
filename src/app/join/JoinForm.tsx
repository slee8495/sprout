"use client";

import { useActionState } from "react";
import { join } from "./actions";

export function JoinForm() {
  const [error, formAction, pending] = useActionState(join, undefined);

  return (
    <form
      action={formAction}
      className="flex flex-col gap-3 rounded-3xl border border-emerald-200/70 bg-white p-5 shadow-md shadow-emerald-900/5 dark:border-emerald-800/50 dark:bg-zinc-900 dark:shadow-black/40"
    >
      <input
        type="text"
        name="familyCode"
        placeholder="Family code"
        required
        className="rounded-2xl border border-emerald-100 bg-white px-3 py-2 uppercase tracking-widest dark:border-emerald-900/40 dark:bg-zinc-900"
      />
      <input
        type="text"
        name="name"
        placeholder="Your name"
        required
        className="rounded-2xl border border-emerald-100 bg-white px-3 py-2 dark:border-emerald-900/40 dark:bg-zinc-900"
      />
      <input
        type="password"
        name="passphrase"
        placeholder="Family passphrase"
        required
        className="rounded-2xl border border-emerald-100 bg-white px-3 py-2 dark:border-emerald-900/40 dark:bg-zinc-900"
      />
      <button
        type="submit"
        disabled={pending}
        className="rounded-full bg-emerald-600 px-4 py-2 font-heading font-semibold text-white shadow-sm shadow-emerald-900/20 transition-transform hover:scale-105 hover:bg-emerald-700 active:scale-95 disabled:opacity-50 disabled:hover:scale-100"
      >
        {pending ? "Joining…" : "Join family"}
      </button>
      {error && <p className="text-sm text-rose-600">{error}</p>}
    </form>
  );
}
