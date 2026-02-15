import { PrismaClient } from "@prisma/client";

const globalForPrisma = global;

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    // В Prisma 7 для прямого управления используем datasourceUrl
    datasourceUrl: process.env.POSTGRES_URL_NON_POOLING || process.env.DATABASE_URL,
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
