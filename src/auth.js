// auth.js
import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { db } from "./lib/db"; // Проверь путь! Если папка lib в корне, то "@/lib/db"

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Google({
      clientId: process.env.AUTH_GOOGLE_ID,
      clientSecret: process.env.AUTH_GOOGLE_SECRET,
    }),
    Credentials({
      name: "Credentials",
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        // Ищем в Neon через Prisma
        const user = await db.user.findUnique({
          where: { 
            username: credentials.email // Мы договорились, что логин = email
          }
        });

        if (!user) return null;

        // Сравниваем пароли
        const isPasswordCorrect = await bcrypt.compare(
          credentials.password,
          user.password
        );

        if (isPasswordCorrect) {
          return { 
            id: user.id.toString(), 
            name: user.username, 
            email: user.username 
          };
        }
        
        return null;
      }
    })
  ],
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: '/', 
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) token.id = user.id;
      return token;
    },
    async session({ session, token }) {
      if (session.user) session.user.id = token.id;
      return session;
    },
  },
});
