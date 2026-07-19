import { auth } from "@/auth";

export async function requireSession() {
  const session = await auth();
  if (!session?.user?.id || !session.user.familyId) {
    throw new Error("Unauthorized");
  }
  return { userId: Number(session.user.id), familyId: session.user.familyId, name: session.user.name };
}
