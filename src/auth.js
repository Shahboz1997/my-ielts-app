import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/prisma";
import Google from "next-auth/providers/google"; // ИСПРАВЛЕНО: Прямой импорт
import Credentials from "next-auth/providers/credentials"; // ИСПРАВЛЕНО: Прямой импорт
import bcrypt from "bcryptjs"; // ИСПРАВЛЕНО: Используем bcryptjs (безопаснее для билда)

export const { handlers, auth, signIn, signOut } = NextAuth({
  // Prisma 7 может капризничать при билде, если база недоступна. 
  // Адаптер подключаем только если клиент инициализирован.
  adapter: PrismaAdapter(prisma),
  providers: [
    Google({
      clientId: process.env.AUTH_GOOGLE_ID,
      clientSecret: process.env.AUTH_GOOGLE_SECRET,
      allowDangerousEmailAccountLinking: true, 
    }),
    Credentials({
      name: "Credentials",
      async authorize(credentials) {
        // Защита от пустых данных
        if (!credentials?.email || !credentials?.password) return null;

        try {
          const user = await prisma.user.findUnique({
            where: { username: String(credentials.email).toLowerCase() },
          });

          if (!user || !user.password) return null;

          // bcryptjs работает в Edge и Node.js без ошибок компиляции
          const isPasswordCorrect = await bcrypt.compare(
            String(credentials.password),
            user.password
          );

          if (!isPasswordCorrect) return null;

          return {
            id: user.id.toString(),
            email: user.username,
            name: user.name,
          };
        } catch (error) {
          console.error("Auth error:", error);
          return null;
        }
      },
    }),
  ],
  session: { 
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 дней
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user && token?.id) {
        session.user.id = token.id;
      }
      return session;
    },
  },
  pages: {
    signIn: "/", 
  },
  // Секретный ключ обязателен для работы JWT
  secret: process.env.NEXTAUTH_SECRET, 
});
