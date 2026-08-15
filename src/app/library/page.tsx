import { redirect } from "next/navigation";
import { listChildren, listJournalEntries } from "@/db/queries";
import { requireSession } from "@/lib/session";
import { T } from "../T";
import { LibraryGrid } from "./LibraryGrid";

export default async function LibraryPage() {
  const { familyId } = await requireSession();

  const kids = await listChildren(familyId);
  if (kids.length === 0) redirect("/onboarding");

  const entries = await listJournalEntries(familyId, "child");
  // Albums are photo albums — text/voice/video-only entries don't get a page.
  const photoEntries = entries.filter((entry) => entry.photos.length > 0);

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 p-4 pb-24">
      <header className="pt-4">
        <h1 className="font-heading text-2xl font-bold text-brand-700 dark:text-brand-300">
          <T>📚 Albums</T>
        </h1>
      </header>
      <LibraryGrid kids={kids} photoEntries={photoEntries} />
    </div>
  );
}
