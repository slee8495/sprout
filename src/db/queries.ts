import { eq } from "drizzle-orm";
import { db } from "./index";
import { families, users } from "./schema";

export async function getOrCreateUser(email: string, name?: string | null, imageUrl?: string | null) {
  const existing = await db.query.users.findFirst({ where: eq(users.email, email) });
  if (existing) return existing;

  let family = await db.query.families.findFirst();
  if (!family) {
    [family] = await db
      .insert(families)
      .values({ name: process.env.FAMILY_NAME ?? "Our Family" })
      .returning();
  }

  const [user] = await db
    .insert(users)
    .values({ familyId: family.id, email, name, imageUrl })
    .returning();
  return user;
}
