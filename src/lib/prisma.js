import { PrismaClient } from '@prisma/client';

const globalForPrisma = global;

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: ['error'], // Минимум логов для скорости
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
