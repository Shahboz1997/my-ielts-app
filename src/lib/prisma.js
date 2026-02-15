import { PrismaClient } from "@prisma/client";

const globalForPrisma = global;

// Если мы на этапе сборки и базы нет, даем временную строку, чтобы билд не падал
const connectionString = process.env.DATABASE_URL || "postgresql://postgres:postgres@localhost:5432/db";

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    datasourceUrl: connectionString, 
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
