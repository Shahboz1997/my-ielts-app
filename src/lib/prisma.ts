
import { PrismaClient } from '@prisma/client/index' 
// или попробуйте:


// 1. Определяем интерфейс для глобальной переменной
interface GlobalPrisma {
  prisma: PrismaClient | undefined
}

// 2. Используем глобальный объект с приведением типов
const globalForPrisma = globalThis as unknown as GlobalPrisma

// 3. Создаем экземпляр клиента (синглтон)
export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  })

// 4. Сохраняем в глобальную переменную только в разработке (для Hot Reload)
if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
