import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"
import GitHub from "next-auth/providers/github"
import Google from "next-auth/providers/google"
import { DrizzleAdapter } from "@auth/drizzle-adapter"
import { db } from "@/services/db"
import { accounts, sessions, users, verificationTokens } from "@/services/db/schema"
import { getSafeRedirectUrl } from "@/services/security/redirect"

const authSecret =
  process.env.AUTH_SECRET ||
  process.env.NEXTAUTH_SECRET ||
  (process.env.NODE_ENV === "production" ? undefined : "dev-fallback-secret-pub-ai-not-for-production");

export const { handlers, signIn, signOut, auth } = NextAuth({
  secret: authSecret,
  adapter: DrizzleAdapter(db, {
    usersTable: users,
    accountsTable: accounts,
    sessionsTable: sessions,
    verificationTokensTable: verificationTokens,
  }),
  providers: [
    Google({
      clientId: process.env.AUTH_GOOGLE_ID,
      clientSecret: process.env.AUTH_GOOGLE_SECRET,
    }),
    GitHub({
      clientId: process.env.AUTH_GITHUB_ID,
      clientSecret: process.env.AUTH_GITHUB_SECRET,
    }),
    Credentials({
      name: "Credentials",
      credentials: {
        username: { label: "Username", type: "text", placeholder: "admin" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        try {
          if (!credentials?.username || !credentials?.password) {
            return null;
          }
          // Credential login is disabled unless secure verification is implemented
          return null;
        } catch (error) {
          console.error("[NextAuth] Authorize error:", error);
          return null;
        }
      },
    }),
  ],
  debug: process.env.NODE_ENV === "development",
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/",
  },
  callbacks: {
    async jwt({ token, user }) {
      try {
        if (user) {
          token.id = user.id;
          if (user.role) {
            token.role = user.role;
          }
          if (user.credits !== undefined) {
            token.credits = user.credits;
          }
        }
        if (!token.id && token.sub) {
          token.id = token.sub;
        }
        return token;
      } catch (error) {
        console.error("[NextAuth] Error in jwt callback:", error);
        return token;
      }
    },
    async session({ session, token }) {
      try {
        if (session.user) {
          session.user.id = (token.id as string) || (token.sub as string) || "";
          if (token.role) {
            session.user.role = token.role as string;
          }
          if (typeof token.credits === "number") {
            session.user.credits = token.credits;
          }
        }
        return session;
      } catch (error) {
        console.error("[NextAuth] Error in session callback:", error);
        return session;
      }
    },
    async signIn({ user, account }) {
      try {
        if (account?.provider === "google" || account?.provider === "github") {
          if (!user?.email) {
            console.error(`[NextAuth] Sign-in rejected: missing email for ${account.provider}`);
            return false;
          }
        }
        return true;
      } catch (error) {
        console.error("[NextAuth] Error in signIn callback:", error);
        return false;
      }
    },
    async redirect({ url, baseUrl }) {
      try {
        const safeUrl = getSafeRedirectUrl(url, {
          baseUrl,
          fallbackUrl: baseUrl,
        });
        if (safeUrl.startsWith("/")) {
          return `${baseUrl}${safeUrl}`;
        }
        return safeUrl;
      } catch (error) {
        console.error("[NextAuth] Error in redirect callback:", error);
        return baseUrl;
      }
    },
  },
})

