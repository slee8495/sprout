import type { DefaultSession } from "next-auth";

type UserRole = "owner" | "editor" | "viewer";
type UserTier = "inner" | "extended";

declare module "next-auth" {
  interface User {
    familyId?: number;
    role?: UserRole;
    tier?: UserTier;
  }

  interface Session {
    user: {
      id: string;
      familyId?: number;
      role?: UserRole;
      tier?: UserTier;
    } & DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    familyId?: number;
    role?: UserRole;
    tier?: UserTier;
  }
}
