import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { getOrCreateUser } from "@/db/queries";

const PARENT_NAMES = (process.env.PARENT_NAMES ?? "Dad,Mom")
  .split(",")
  .map((n) => n.trim())
  .filter(Boolean);

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Credentials({
      credentials: {
        name: { label: "Name" },
        passphrase: { label: "Passphrase", type: "password" },
      },
      authorize: async (credentials) => {
        const name = typeof credentials?.name === "string" ? credentials.name : "";
        const passphrase = typeof credentials?.passphrase === "string" ? credentials.passphrase : "";

        if (!PARENT_NAMES.includes(name)) return null;
        if (!process.env.APP_PASSPHRASE || passphrase !== process.env.APP_PASSPHRASE) return null;

        const email = `${name.toLowerCase()}@sprout.local`;
        const user = await getOrCreateUser(email, name, null);
        return { id: String(user.id), name: user.name, email: user.email };
      },
    }),
  ],
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
});

export { PARENT_NAMES };
