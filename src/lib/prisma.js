import { PrismaClient } from '@prisma/client';

// Используем globalThis для хранения экземпляра в глобальной области видимости
const prisma = globalThis.prisma || new PrismaClient({
  datasources: {
    db: {
      url: connectionString,
    },
  },
});

// В режиме разработки сохраняем клиент глобально, чтобы не плодить 
// новые подключения при каждом сохранении файла
if (process.env.NODE_ENV !== 'production') {
  globalThis.prisma = prisma;
}

export { prisma };
