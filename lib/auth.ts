import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";

// Import env.ts to trigger startup validation of NEXTAUTH_SECRET, ADMIN_EMAIL,
// and ADMIN_PASSWORD (and all other required environment variables).
import { getNextauthSecret, getAdminCredentials } from "@/lib/env";

/** Shape of the admin user object returned by authorize(). */
type AdminUser = {
  id: string;
  name: string;
  email: string;
  role: string;
};

export const { handlers, auth, signIn, signOut } = NextAuth({
  session: {
    strategy: "jwt",
  },

  providers: [
    Credentials({
      name: "Admin",

      credentials: {
        email: {},
        password: {},
      },

      async authorize(credentials): Promise<AdminUser | null> {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const { email: adminEmail, password: adminPassword } = getAdminCredentials();
        const email = credentials.email as string;
        const password = credentials.password as string;

        if (email !== adminEmail) {
          return null;
        }

        const passwordMatches =
          password === adminPassword ||
          (await bcrypt
            .compare(password, adminPassword)
            .catch(() => false));

        if (!passwordMatches) {
          return null;
        }

        return {
          id: "admin",
          name: "Vidarbha Print Admin",
          email: adminEmail,
          role: "admin",
        };
      },
    }),
  ],

  pages: {
    signIn: "/login",
  },

  callbacks: {
    /**
     * Persist the `role` field from the authorized user into the JWT payload.
     *
     * Without this callback the role is returned by `authorize()` but stored
     * only in the session (which uses JWT strategy), so it is lost.
     */
    jwt({ token, user }) {
      if (user) {
        token.role = (user as { role?: string }).role;
      }
      return token;
    },

    /**
     * Forward the `role` from the JWT into the session object so that
     * `requireAdmin()` can inspect `session.user.role`.
     */
    session({ session, token }) {
      const role = (token as { role?: string }).role;
      if (role) {
        session.user = { ...session.user, role };
      }
      return session;
    },
  },

  secret: getNextauthSecret(),
});