import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { getPrisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

// Конфигурация AuthOptions
export const authOptions = {
  trustHost: true, // нужен для OAuth callback на localhost и Vercel
  adapter: PrismaAdapter(getPrisma()),
  providers: [
    // 1. Вход через Google
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      allowDangerousEmailAccountMerging: true, // Позволяет объединять вход Google и Email
    }),
    // 2. Вход через Email/Пароль
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

        const prisma = getPrisma();
        const user = await prisma.user.findUnique({
          where: { email },
        });

        // Если пользователя нет или он зашел через Google (нет пароля в базе)
        if (!user || !user.password) return null;

        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) return null;

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          credits: user.credits,
          language: user.language || 'en',
        };
      },
    }),
  ],
  session: {
    strategy: "jwt", // Обязательно для Credentials и Middleware
  },
  callbacks: {
    // Отладка + связывание аккаунта Google с существующим пользователем по email
    async signIn({ user, account, profile }) {
      console.log("DEBUG SIGNIN:", {
        email: user?.email,
        provider: account?.provider,
        profileEmail: profile?.email,
      });
      if (account?.provider === "google" && user?.email) {
        const prisma = getPrisma();
        const existingUser = await prisma.user.findUnique({
          where: { email: user.email },
        });
        if (existingUser) {
          try {
            await prisma.account.upsert({
              where: {
                provider_providerAccountId: {
                  provider: "google",
                  providerAccountId: account.providerAccountId,
                },
              },
              create: {
                userId: existingUser.id,
                type: account.type ?? "oauth",
                provider: "google",
                providerAccountId: account.providerAccountId,
                access_token: account.access_token ?? null,
                refresh_token: account.refresh_token ?? null,
                expires_at: account.expires_at ?? null,
              },
              update: {},
            });
            console.log("DEBUG SIGNIN: Account linked for", user.email, "providerAccountId", account.providerAccountId);
          } catch (err) {
            console.error("DEBUG SIGNIN: upsert Account failed", err);
          }
        } else {
          console.log("DEBUG SIGNIN: No existing user for email", user.email, "- adapter will create new user");
        }
      }
      return true;
    },
    // Сохраняем ID и Кредиты пользователя в JWT токене
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = user.id;
        token.credits = user.credits;
        token.language = user.language;
        if (!token.language) {
          try {
            const prisma = getPrisma();
            const dbUser = await prisma.user.findUnique({ where: { id: user.id }, select: { language: true } });
            token.language = dbUser?.language || 'en';
          } catch (_) {
            token.language = 'en';
          }
        }
      }
      if (trigger === "update") {
        if (session?.credits !== undefined) token.credits = session.credits;
        if (session?.language !== undefined) token.language = session.language;
      }
      return token;
    },
    // Передаем данные из токена в объект сессии (доступен через useSession)
    async session({ session, token }) {
      if (session?.user) {
        session.user.id = token?.id ?? session.user.email;
        session.user.credits = token?.credits ?? 0;
        session.user.language = token?.language ?? 'en';
      }
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
  pages: {
    signIn: "/", // Твоя главная страница с модальным окном
    error: "/",  // Перенаправление при ошибках
  },
  debug: process.env.NODE_ENV === "development",
};

// NextAuth v5: returns { handlers, auth, signIn, signOut }
const nextAuth = NextAuth(authOptions);
export const { handlers, auth } = nextAuth;
export const { GET, POST } = handlers;

// import NextAuth from "next-auth";
// import CredentialsProvider from "next-auth/providers/credentials";
// import GoogleProvider from "next-auth/providers/google";
// import { PrismaAdapter } from "@auth/prisma-adapter";
// import { getPrisma } from "@/lib/prisma";
// import bcrypt from "bcryptjs";

// function buildAuthOptions() {
//   if (!process.env.NEXTAUTH_SECRET) {
//     throw new Error("NEXTAUTH_SECRET is not set. Add it to .env or .env.local");
//   }
//   const prisma = getPrisma();

//   return {
//     adapter: PrismaAdapter(prisma),
//     providers: [
//       GoogleProvider({
//         clientId: process.env.GOOGLE_CLIENT_ID,
//         clientSecret: process.env.GOOGLE_CLIENT_SECRET,
//       }),
//       CredentialsProvider({
//         name: "credentials",
//         credentials: {
//           email: { label: "Email", type: "email" },
//           password: { label: "Password", type: "password" },
//         },
//         async authorize(credentials) {
//           const email = credentials?.email?.trim();
//           const password = credentials?.password;

//           if (!email || !password) return null;

//           const user = await prisma.user.findUnique({
//             where: { email },
//           });

//           if (!user?.password) return null;

//           const isPasswordValid = await bcrypt.compare(password, user.password);
//           if (!isPasswordValid) return null;

//           return {
//             id: user.id,
//             email: user.email,
//             name: user.name ?? undefined,
//           };
//         },
//       }),
//     ],
//     session: {
//       strategy: "jwt",
//     },
//     callbacks: {
//       async jwt({ token, user, account }) {
//         if (user?.id) token.id = user.id;
//         if (account) token.accessToken = account.access_token;
//         return token;
//       },
//       async session({ session, token }) {
//         if (session.user && token?.id) session.user.id = token.id;
//         return session;
//       },
//     },
//     secret: process.env.NEXTAUTH_SECRET,
//     pages: {
//       signIn: "/",
//     },
//   };
// }

// // Lazy init so buildAuthOptions() runs at request time, not at build (avoids "Failed to collect page data")
// let nextAuthInstance;
// function getNextAuth() {
//   if (!nextAuthInstance) nextAuthInstance = NextAuth(buildAuthOptions());
//   return nextAuthInstance;
// }
// export const GET = (req, ctx) => getNextAuth().handlers.GET(req, ctx);
// export const POST = (req, ctx) => getNextAuth().handlers.POST(req, ctx);
// /** NextAuth v5: use auth() instead of getServerSession */
// export async function auth() {
//   return getNextAuth().auth();
// }
