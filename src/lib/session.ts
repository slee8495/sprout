import { redirect } from "next/navigation";
import { auth } from "@/auth";

export async function requireSession() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  if (!session.user.familyId) redirect("/connect");
  return { userId: Number(session.user.id), familyId: session.user.familyId, name: session.user.name };
}
