"use client";

import { useActionState } from "react";
import { login } from "./actions";

export function LoginForm({ parentNames }: { parentNames: string[] }) {
  const [error, formAction, pending] = useActionState(login, undefined);

  return (
    <form
      action={formAction}
      className="flex flex-col gap-3 rounded-3xl border border-emerald-200/70 bg-white p-5 shadow-md shadow-emerald-900/5 dark:border-emerald-800/50 dark:bg-zinc-900 dark:shadow-black/40"
    >
      <select
        name="name"
        className="rounded-2xl border border-emerald-100 bg-white px-3 py-2 dark:border-emerald-900/40 dark:bg-zinc-900"
      >
        {parentNames.map((n) => (
          <option key={n} value={n}>
            {n}
          </option>
        ))}
      </select>
      <input
        type="password"
        name="passphrase"
        placeholder="Passphrase"
        required
        className="rounded-2xl border border-emerald-100 bg-white px-3 py-2 dark:border-emerald-900/40 dark:bg-zinc-900"
      />
      <button
        type="submit"
        disabled={pending}
        className="rounded-full bg-emerald-600 px-4 py-2 font-heading font-semibold text-white shadow-sm shadow-emerald-900/20 transition-transform hover:scale-105 hover:bg-emerald-700 active:scale-95 disabled:opacity-50 disabled:hover:scale-100"
      >
        {pending ? "Signing in…" : "Sign in"}
      </button>
      {error && <p className="text-sm text-rose-600">{error}</p>}
    </form>
  );
}
