import { PrismaClient } from "@prisma/client";

// Создаем глобальную переменную, чтобы Prisma не пересоздавалась при каждом обновлении кода
const globalForPrisma = global;

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: ["query"], // Опционально: видеть запросы в консоли
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
