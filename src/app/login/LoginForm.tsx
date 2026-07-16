"use client";

import { useActionState } from "react";
import { login } from "./actions";

export function LoginForm({ parentNames }: { parentNames: string[] }) {
  const [error, formAction, pending] = useActionState(login, undefined);

  return (
    <form action={formAction} className="flex flex-col gap-3">
      <select
        name="name"
        className="rounded-lg border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
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
        className="rounded-lg border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
      />
      <button
        type="submit"
        disabled={pending}
        className="rounded-lg bg-emerald-700 px-3 py-2 font-medium text-white disabled:opacity-50"
      >
        {pending ? "Signing in…" : "Sign in"}
      </button>
      {error && <p className="text-sm text-red-600">{error}</p>}
    </form>
  );
}
