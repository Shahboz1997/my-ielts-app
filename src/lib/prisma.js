import { PrismaClient } from '@prisma/client';

const globalForPrisma = global;

// Создаем инстанс
const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: ['error'],
  });

// Сохраняем в глобальный объект для разработки
if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

// ГАРАНТИРОВАННЫЙ ЭКСПОРТ (именно это ищет ошибка)
export { prisma };
