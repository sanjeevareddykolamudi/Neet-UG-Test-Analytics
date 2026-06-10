import type { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";

import { env } from "@/lib/env";
import { userService } from "@/services/user.service";

// Enable credentials provider only in development environments lacking Google secrets
const isProduction = env.APP_ENV === "production" || (env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET);

const providers: NextAuthOptions["providers"] = [
  GoogleProvider({
    clientId: env.GOOGLE_CLIENT_ID || "mock-google-client-id",
    clientSecret: env.GOOGLE_CLIENT_SECRET || "mock-google-client-secret",
    allowDangerousEmailAccountLinking: true
  })
];

if (!isProduction) {
  providers.push(
    CredentialsProvider({
      name: "Demo Account",
      credentials: {
        email: { label: "Email", type: "email", placeholder: "demo@example.com" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (credentials?.email === "demo@example.com" || credentials?.email?.endsWith("@example.com")) {
          return {
            id: "demo-user-id",
            name: "Demo Student",
            email: credentials.email,
            image: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=256&auto=format&fit=crop"
          };
        }
        return null;
      }
    })
  );
}

export const authOptions: NextAuthOptions = {
  providers,
  // Using JWT session strategy to minimize database read/write connections on MongoDB Atlas Free Tier
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60 // 30 days
  },
  cookies: isProduction ? {
    sessionToken: {
      name: `__Secure-next-auth.session-token`,
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: true
      }
    },
    callbackUrl: {
      name: `__Secure-next-auth.callback-url`,
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: true
      }
    },
    csrfToken: {
      name: `__Host-next-auth.csrf-token`,
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: true
      }
    }
  } : undefined,
  pages: {
    signIn: "/sign-in"
  },
  callbacks: {
    async signIn({ account, profile, user }) {
      if (account?.provider === "credentials") {
        return true;
      }
      
      if (account?.provider === "google" && profile?.email) {
        try {
          // Sync Google User details inside database
          const dbUser = await userService.syncGoogleUser({
            email: profile.email,
            name: profile.name || user.name || undefined,
            image: profile.image || user.image || undefined
          });
          user.id = dbUser._id.toString();
          return true;
        } catch (err) {
          console.error("Failed to sync Google user account:", err);
          return false;
        }
      }
      return false;
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user && token) {
        session.user.id = token.id as string;
      }
      return session;
    }
  },
  secret: env.NEXTAUTH_SECRET
};
