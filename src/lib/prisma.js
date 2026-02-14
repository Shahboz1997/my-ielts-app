import { Pool, neonConfig } from '@neondatabase/serverless';
import { PrismaNeon } from '@prisma/adapter-neon';
import { PrismaClient } from '@prisma/client';
import ws from 'ws';

// Настройка для работы в Node.js среде (локально)
neonConfig.webSocketConstructor = ws;

const connectionString = process.env.POSTGRES_PRISMA_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaNeon(pool);

const prisma = global.prisma || new PrismaClient({ adapter });

if (process.env.NODE_ENV !== 'production') global.prisma = prisma;

export { prisma };
