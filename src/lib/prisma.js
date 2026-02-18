import { PrismaClient } from '../../generated/prisma';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

const globalForPrisma = globalThis;

function createPgPool() {
  // Use DIRECT_URL for Prisma + pg adapter to avoid pooler limitations
  // (e.g. compound findUnique can fail through pooler). Fallback to DATABASE_URL.
  const connectionString =
    process.env.DIRECT_URL || process.env.DATABASE_URL;
  const ssl = connectionString?.includes('sslmode=require')
    ? { rejectUnauthorized: false }
    : undefined;

  return new Pool({
    connectionString,
    ssl,
  });
}

function createPrismaClient() {
  const pool = globalForPrisma.pgPool ?? createPgPool();
  if (!globalForPrisma.pgPool) globalForPrisma.pgPool = pool;

  const adapter = new PrismaPg(pool);
  return new PrismaClient({ adapter });
}

export function getPrisma() {
  if (!globalForPrisma.prisma) {
    globalForPrisma.prisma = createPrismaClient();
  }
  return globalForPrisma.prisma;
}

