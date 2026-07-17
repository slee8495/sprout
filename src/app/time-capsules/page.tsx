import { auth } from "@/auth";
import { listTimeCapsules } from "@/db/queries";
import { formatEntryDate } from "@/lib/milestones";
import { CapsuleForm } from "./CapsuleForm";

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

export default async function TimeCapsulesPage() {
  const session = await auth();
  const capsules = await listTimeCapsules(session!.user!.familyId);
  const today = todayISO();

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 p-4 pb-24">
      <header className="pt-4">
        <h1 className="font-heading text-2xl font-bold text-emerald-700 dark:text-emerald-300">📬 Time Capsules</h1>
        <p className="text-sm text-zinc-500">Write a message today that opens on a future date.</p>
      </header>
      <CapsuleForm />

      <div className="flex flex-col gap-3">
        {capsules.length === 0 && (
          <p className="text-center text-sm text-zinc-500">No messages yet.</p>
        )}
        {capsules.map((capsule) => {
          const isLocked = capsule.unlockDate > today;
          return (
            <article
              key={capsule.id}
              className={`flex flex-col gap-2 rounded-3xl border p-4 shadow-md ${
                isLocked
                  ? "border-emerald-100/50 bg-emerald-50/40 shadow-transparent dark:border-emerald-900/30 dark:bg-zinc-900"
                  : "border-emerald-200/70 bg-white shadow-emerald-900/5 dark:border-emerald-800/50 dark:bg-zinc-900 dark:shadow-black/40"
              }`}
            >
              <div className="flex items-center justify-between text-xs text-zinc-500">
                <span>
                  {isLocked ? "🔒 Opens" : "🔓 Opened"} {formatEntryDate(capsule.unlockDate)}
                </span>
                {!isLocked && capsule.author?.name && <span>from {capsule.author.name}</span>}
              </div>
              {isLocked ? (
                <p className="text-sm italic text-zinc-400">
                  This message is sealed until {formatEntryDate(capsule.unlockDate)}.
                </p>
              ) : (
                <>
                  {capsule.title && <h2 className="font-heading font-bold">{capsule.title}</h2>}
                  <p className="whitespace-pre-wrap text-sm text-zinc-700 dark:text-zinc-300">
                    {capsule.body}
                  </p>
                </>
              )}
            </article>
          );
        })}
      </div>
    </div>
  );
}
