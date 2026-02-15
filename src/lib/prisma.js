import { PrismaClient } from "@prisma/client";

const globalForPrisma = global;

// Важно: export const, а не export default
export const prisma = globalForPrisma.prisma || new PrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
