import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { compare } from "bcryptjs";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";

export const authOptions: NextAuthOptions = {
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  pages: {
    signIn: "/login",
    newUser: "/onboarding",
  },
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;
        const [user] = await db
          .select()
          .from(users)
          .where(eq(users.email, credentials.email))
          .limit(1);
        if (!user?.passwordHash) return null;
        const ok = await compare(credentials.password, user.passwordHash);
        if (!ok) return null;
        return {
          id: user.id,
          email: user.email,
          name: user.name ?? undefined,
          image: user.image ?? undefined,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = user.id;
        token.email = user.email;
        token.name = user.name;
        token.picture = user.image;
        const [dbUser] = await db
          .select({ classLevel: users.classLevel, subjects: users.subjects })
          .from(users)
          .where(eq(users.id, user.id))
          .limit(1);
        if (dbUser) {
          token.classLevel = dbUser.classLevel ?? undefined;
          token.subjects = dbUser.subjects ?? [];
        }
      }
      if (trigger === "update" && session && token.id) {
        const [dbUser] = await db
          .select({ classLevel: users.classLevel, subjects: users.subjects })
          .from(users)
          .where(eq(users.id, token.id))
          .limit(1);
        if (dbUser) {
          token.classLevel = dbUser.classLevel ?? undefined;
          token.subjects = dbUser.subjects ?? [];
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        (session.user as { classLevel?: string }).classLevel = token.classLevel as string | undefined;
        (session.user as { subjects?: string[] }).subjects = (token.subjects as string[]) ?? [];
      }
      return session;
    },
  },
};
