import NextAuth from "next-auth"
import Google from "next-auth/providers/google"
import Credentials from "next-auth/providers/credentials"
import { PrismaAdapter } from "@auth/prisma-adapter"
import { prisma } from "@/lib/db"
import bcrypt from "bcryptjs"

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  providers: [ 
    Google({
      clientId: String(process.env.AUTH_GOOGLE_ID || ""),
      clientSecret: String(process.env.AUTH_GOOGLE_SECRET || ""),
      allowDangerousEmailAccountLinking: true, 
    }),
    Credentials({
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;
        const user = await prisma.user.findUnique({ where: { email: String(credentials.email) } });
        if (!user || !user.password) return null;
        
        // Защита от TypeError в bcrypt
        const isMatch = await bcrypt.compare(String(credentials.password), user.password);
        return isMatch ? user : null;
      }
    })
  ],
  secret: String(process.env.AUTH_SECRET || "fallback_secret_32_chars_long_min"),
  session: { strategy: "jwt" },
  trustHost: true,
  callbacks: {
    async session({ session, token }) {
      if (token.sub && session.user) {
        session.user.id = token.sub;
        // Кредиты подтянутся из БД автоматически, если они есть в схеме
      }
      return session;
    }
  }
})
