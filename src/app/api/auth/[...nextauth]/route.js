import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { getPrisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

function buildAuthOptions() {
  if (!process.env.NEXTAUTH_SECRET) {
    throw new Error("NEXTAUTH_SECRET is not set. Add it to .env or .env.local");
  }
  const prisma = getPrisma();

  return {
    adapter: PrismaAdapter(prisma),
    providers: [
      GoogleProvider({
        clientId: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      }),
      CredentialsProvider({
        name: "credentials",
        credentials: {
          email: { label: "Email", type: "email" },
          password: { label: "Password", type: "password" },
        },
        async authorize(credentials) {
          const email = credentials?.email?.trim();
          const password = credentials?.password;

          if (!email || !password) return null;

          const user = await prisma.user.findUnique({
            where: { email },
          });

          if (!user?.password) return null;

          const isPasswordValid = await bcrypt.compare(password, user.password);
          if (!isPasswordValid) return null;

          return {
            id: user.id,
            email: user.email,
            name: user.name ?? undefined,
          };
        },
      }),
    ],
    session: {
      strategy: "jwt",
    },
    callbacks: {
      async jwt({ token, user, account }) {
        if (user?.id) token.id = user.id;
        if (account) token.accessToken = account.access_token;
        return token;
      },
      async session({ session, token }) {
        if (session.user && token?.id) session.user.id = token.id;
        return session;
      },
    },
    secret: process.env.NEXTAUTH_SECRET,
    pages: {
      signIn: "/",
    },
  };
}

// Lazy init so buildAuthOptions() runs at request time, not at build (avoids "Failed to collect page data")
let handlers;
function getHandlers() {
  if (!handlers) handlers = NextAuth(buildAuthOptions());
  return handlers;
}
export const GET = (req, ctx) => getHandlers().GET(req, ctx);
export const POST = (req, ctx) => getHandlers().POST(req, ctx);
