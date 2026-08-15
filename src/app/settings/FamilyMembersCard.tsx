"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { useSettings } from "../SettingsProvider";
import { changeMemberRole, changeMemberTier } from "./actions";

export type FamilyMember = {
  id: number;
  name: string | null;
  email: string;
  role: "owner" | "editor" | "viewer";
  tier: "inner" | "extended";
};

const ROLE_OPTIONS: { value: FamilyMember["role"]; label: string }[] = [
  { value: "owner", label: "Owner" },
  { value: "editor", label: "Editor" },
  { value: "viewer", label: "View only" },
];

const TIER_OPTIONS: { value: FamilyMember["tier"]; label: string }[] = [
  { value: "inner", label: "Full access" },
  { value: "extended", label: "Extended (limited)" },
];

function roleBadgeClasses(role: FamilyMember["role"]) {
  if (role === "owner") return "bg-brand-600 text-white";
  if (role === "viewer") return "border border-zinc-300 text-zinc-600 dark:border-zinc-700 dark:text-zinc-400";
  return "border border-brand-200 text-brand-700 dark:border-brand-800/50 dark:text-brand-300";
}

export function FamilyMembersCard({ members, isOwner, userId }: { members: FamilyMember[]; isOwner: boolean; userId: number }) {
  const router = useRouter();
  const { t } = useSettings();
  const [isPending, startTransition] = useTransition();

  function handleRoleChange(memberId: number, role: FamilyMember["role"]) {
    startTransition(async () => {
      await changeMemberRole(memberId, role);
      router.refresh();
    });
  }

  function handleTierChange(memberId: number, tier: FamilyMember["tier"]) {
    startTransition(async () => {
      await changeMemberTier(memberId, tier);
      router.refresh();
    });
  }

  return (
    <section className="flex flex-col gap-3 rounded-3xl border border-brand-200/70 bg-white p-4 dark:border-brand-800/50 dark:bg-zinc-900">
      <h2 className="font-heading text-sm font-semibold text-brand-800 dark:text-brand-200">{t("Family members")}</h2>

      <div className="flex flex-col gap-2">
        {members.map((member) => (
          <div
            key={member.id}
            className="flex flex-col gap-2 rounded-2xl border border-brand-100 px-3 py-2 text-sm dark:border-brand-900/40"
          >
            <div className="flex items-center justify-between gap-2">
              <div className="min-w-0">
                <p className="truncate font-semibold text-brand-900 dark:text-brand-100">
                  {member.name ?? member.email}
                  {member.id === userId && <span className="ml-1 font-normal text-zinc-500 dark:text-zinc-400">({t("you")})</span>}
                </p>
                <p className="truncate text-xs text-zinc-500 dark:text-zinc-400">{member.email}</p>
              </div>

              {isOwner && member.id !== userId ? (
                <select
                  value={member.role}
                  disabled={isPending}
                  onChange={(e) => handleRoleChange(member.id, e.target.value as FamilyMember["role"])}
                  className="shrink-0 rounded-full border border-brand-200 bg-white px-2 py-1 text-xs font-semibold text-brand-800 disabled:opacity-50 dark:border-brand-800/50 dark:bg-zinc-900 dark:text-brand-200"
                >
                  {ROLE_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {t(opt.label)}
                    </option>
                  ))}
                </select>
              ) : (
                <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold ${roleBadgeClasses(member.role)}`}>
                  {t(ROLE_OPTIONS.find((opt) => opt.value === member.role)?.label ?? member.role)}
                </span>
              )}
            </div>

            {isOwner && member.id !== userId && (
              <label className="flex items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400">
                {t("Sees:")}
                <select
                  value={member.tier}
                  disabled={isPending}
                  onChange={(e) => handleTierChange(member.id, e.target.value as FamilyMember["tier"])}
                  className="rounded-full border border-brand-200 bg-white px-2 py-1 text-xs font-semibold text-brand-800 disabled:opacity-50 dark:border-brand-800/50 dark:bg-zinc-900 dark:text-brand-200"
                >
                  {TIER_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {t(opt.label)}
                    </option>
                  ))}
                </select>
              </label>
            )}
          </div>
        ))}
      </div>

      {isOwner && (
        <p className="text-xs text-zinc-500 dark:text-zinc-400">
          {t("View only members can see everything but can't add or edit entries, comments, or kids/pets.")}
          {" "}
          {t('"Extended" members never see entries marked 🔒 Just us.')}
        </p>
      )}
    </section>
  );
}
