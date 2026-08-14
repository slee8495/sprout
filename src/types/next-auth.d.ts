import type { DefaultSession } from "next-auth";

type UserRole = "owner" | "editor" | "viewer";

declare module "next-auth" {
  interface User {
    familyId?: number;
    role?: UserRole;
  }

  interface Session {
    user: {
      id: string;
      familyId?: number;
      role?: UserRole;
    } & DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    familyId?: number;
    role?: UserRole;
  }
}
