import { Pool, neonConfig } from '@neondatabase/serverless';
import { PrismaNeon } from '@prisma/adapter-neon';
import { PrismaClient } from '@prisma/client';
import ws from 'ws';

// 1. Настройка WebSocket для работы в Node.js (исправляет Connection Terminated)
if (typeof window === 'undefined') {
  neonConfig.webSocketConstructor = ws;
}

const prismaClientSingleton = () => {
  const connectionString = process.env.DATABASE_URL;
  
  // 2. Создаем пул соединений Neon
  const pool = new Pool({ connectionString });
  
  // 3. Создаем адаптер (именно его не хватало!)
  const adapter = new PrismaNeon(pool);
  
  // 4. Передаем адаптер в Prisma Client
  return new PrismaClient({ adapter });
};


const globalForPrisma = globalThis;
export const prisma = globalForPrisma.prisma ?? prismaClientSingleton();
if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
