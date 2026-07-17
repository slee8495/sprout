import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface User {
    familyId?: number;
  }

  interface Session {
    user: {
      id: string;
      familyId: number;
    } & DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    familyId?: number;
  }
}
