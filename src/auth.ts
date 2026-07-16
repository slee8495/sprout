import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { getOrCreateUser } from "@/db/queries";

const allowedEmails = (process.env.ALLOWED_EMAILS ?? "")
  .split(",")
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean);

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [Google],
  callbacks: {
    async signIn({ user }) {
      if (!user.email) return false;
      if (!allowedEmails.includes(user.email.toLowerCase())) return false;

      await getOrCreateUser(user.email, user.name, user.image);
      return true;
    },
    async session({ session }) {
      return session;
    },
  },
});
