import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { getFamilyByInviteCode, getFamilyMemberByName } from "@/db/queries";

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Credentials({
      credentials: {
        familyCode: { label: "Family code" },
        name: { label: "Name" },
        passphrase: { label: "Passphrase", type: "password" },
      },
      authorize: async (credentials) => {
        const familyCode = typeof credentials?.familyCode === "string" ? credentials.familyCode.trim() : "";
        const name = typeof credentials?.name === "string" ? credentials.name.trim() : "";
        const passphrase = typeof credentials?.passphrase === "string" ? credentials.passphrase : "";

        if (!familyCode || !name || !passphrase) return null;

        const family = await getFamilyByInviteCode(familyCode.toUpperCase());
        if (!family) return null;

        const validPassphrase = await bcrypt.compare(passphrase, family.passphraseHash);
        if (!validPassphrase) return null;

        const user = await getFamilyMemberByName(family.id, name);
        if (!user) return null;

        return { id: String(user.id), name: user.name, email: user.email, familyId: user.familyId };
      },
    }),
  ],
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.familyId = user.familyId;
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.familyId = token.familyId as number;
      }
      return session;
    },
  },
});
