import { notFound } from "next/navigation";
import { getChild, listChildren, listJournalEntries } from "@/db/queries";
import { requireSession } from "@/lib/session";
import { AlbumView } from "./AlbumView";

export default async function AlbumPage({ params }: { params: Promise<{ childId: string }> }) {
  const { childId } = await params;
  const { familyId, tier } = await requireSession();
  const id = Number(childId);

  const [child, kids, entries] = await Promise.all([
    getChild(id, familyId),
    listChildren(familyId),
    listJournalEntries(familyId, "child", tier),
  ]);
  if (!child) notFound();

  const photoEntries = entries.filter((entry) => entry.photos.length > 0 && entry.children.some((c) => c.id === id));

  return <AlbumView child={child} kids={kids} entries={photoEntries} />;
}
