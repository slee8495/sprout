import { redirect } from "next/navigation";
import { auth } from "@/auth";

export async function requireSession() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  if (!session.user.familyId) redirect("/connect");
  return {
    userId: Number(session.user.id),
    familyId: session.user.familyId,
    name: session.user.name,
    role: session.user.role ?? "editor",
  };
}

// For mutations viewers shouldn't be able to perform (journal entries, comments, kids/pets,
// family settings). Throws rather than redirecting, matching how other action-layer errors
// surface back to the client (e.g. "You can only edit entries you wrote.").
export async function requireEditor() {
  const session = await requireSession();
  if (session.role === "viewer") throw new Error("You have view-only access to this family.");
  return session;
}

// For owner-only actions: managing member roles, deleting the family.
export async function requireOwner() {
  const session = await requireSession();
  if (session.role !== "owner") throw new Error("Only the family owner can do this.");
  return session;
}
