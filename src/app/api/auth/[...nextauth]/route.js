import { handlers } from "@/auth"
export const { GET, POST } = handlers
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google"; // Добавляем Google
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    // Настройка входа через Google
    Google({
      clientId: process.env.AUTH_GOOGLE_ID,
      clientSecret: process.env.AUTH_GOOGLE_SECRET,
    }),
    
    // Настройка входа через Email/Пароль
    Credentials({
      name: "Credentials",
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const user = await prisma.user.findUnique({
          where: { username: credentials.email }, // Убрали "as string"
        });

        if (!user || !user.password) return null;

        const isPasswordCorrect = await bcrypt.compare(
          credentials.password, // Убрали "as string"
          user.password
        );

        if (!isPasswordCorrect) return null;

        return {
          id: user.id.toString(),
          email: user.username,
          name: user.name,
        };
      },
    }),
  ],
  pages: {
    signIn: "/", 
  },
  session: { strategy: "jwt" },
  callbacks: {
    async session({ session, token }) {
      if (token?.sub) session.user.id = token.sub;
      return session;
    },
  },
});
