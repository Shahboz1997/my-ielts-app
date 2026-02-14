// src/auth.js
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { prisma } from "@/lib/prisma"; // Проверь, что импорт именно отсюда!
import bcrypt from "bcryptjs";

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Credentials({
      async authorize(credentials) {
        try {
          if (!credentials?.email || !credentials?.password) return null;

          // Лог для отладки — увидишь в терминале, доходит ли запрос до базы
          console.log("Checking user:", credentials.email);

          const user = await prisma.user.findUnique({
            where: { username: credentials.email },
          });

          if (!user || !user.password) {
            console.log("User not found");
            return null;
          }

          const isPasswordCorrect = await bcrypt.compare(
            credentials.password,
            user.password
          );

          if (!isPasswordCorrect) {
            console.log("Invalid password");
            return null;
          }

          return { id: user.id, email: user.username, name: user.name };
        } catch (error) {
          console.error("DATABASE ERROR:", error); // ТУТ БУДЕТ РЕАЛЬНАЯ ПРИЧИНА
          return null;
        }
      },
    }),
  ],
  session: { strategy: "jwt" },
});
