"use client";

import { useState, useTransition } from "react";
import type { AdminFamilyRow } from "@/db/queries";
import { grantAccess, revokeAccess } from "./actions";

const DURATION_OPTIONS = [
  { label: "1 month", days: 30 },
  { label: "3 months", days: 90 },
  { label: "6 months", days: 180 },
  { label: "1 year", days: 365 },
  { label: "Forever", days: null as number | null },
];

function isComplimentary(family: AdminFamilyRow) {
  return family.subscriptionStatus === "active" && !family.stripeSubscriptionId;
}

function isRealSubscriber(family: AdminFamilyRow) {
  return (family.subscriptionStatus === "active" || family.subscriptionStatus === "past_due") && !!family.stripeSubscriptionId;
}

function FamilyRow({ family }: { family: AdminFamilyRow }) {
  const [days, setDays] = useState<number | null>(90);
  const [isPending, startTransition] = useTransition();

  function handleGrant() {
    startTransition(async () => {
      await grantAccess({ familyId: family.id, days });
    });
  }

  function handleRevoke() {
    startTransition(async () => {
      await revokeAccess(family.id);
    });
  }

  return (
    <div className="flex flex-col gap-2 rounded-3xl border border-brand-100/60 bg-white p-4 shadow-sm dark:border-brand-900/40 dark:bg-zinc-900">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="font-heading font-semibold">{family.name}</p>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            {family.members.map((m) => m.email).join(", ") || "no members"}
          </p>
        </div>
        <span
          className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
            isComplimentary(family)
              ? "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200"
              : isRealSubscriber(family)
                ? "bg-brand-100 text-brand-800 dark:bg-brand-900/40 dark:text-brand-200"
                : "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400"
          }`}
        >
          {isComplimentary(family)
            ? family.subscriptionRenewsAt
              ? `${family.isTrial ? "trial" : "complimentary"} until ${family.subscriptionRenewsAt.toLocaleDateString()}`
              : "complimentary forever"
            : isRealSubscriber(family)
              ? "real subscriber"
              : family.subscriptionStatus}
        </span>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <select
          value={days ?? "forever"}
          onChange={(e) => setDays(e.target.value === "forever" ? null : Number(e.target.value))}
          className="rounded-2xl border border-brand-100 bg-white px-2 py-1 text-xs dark:border-brand-900/40 dark:bg-zinc-900"
        >
          {DURATION_OPTIONS.map((opt) => (
            <option key={opt.label} value={opt.days ?? "forever"}>
              {opt.label}
            </option>
          ))}
        </select>
        <button
          onClick={handleGrant}
          disabled={isPending || isRealSubscriber(family)}
          className="rounded-full bg-brand-600 px-3 py-1 text-xs font-semibold text-white disabled:opacity-40"
        >
          Grant free access
        </button>
        {isComplimentary(family) && (
          <button
            onClick={handleRevoke}
            disabled={isPending}
            className="rounded-full border border-rose-300 px-3 py-1 text-xs font-semibold text-rose-600 disabled:opacity-40"
          >
            Revoke
          </button>
        )}
      </div>
    </div>
  );
}

export function AdminFamilyList({ families }: { families: AdminFamilyRow[] }) {
  return (
    <div className="flex flex-col gap-3">
      {families.map((f) => (
        <FamilyRow key={f.id} family={f} />
      ))}
    </div>
  );
}
