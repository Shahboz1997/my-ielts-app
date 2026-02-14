import "dotenv/config";
import { defineConfig } from "@prisma/config";

export default defineConfig({
  schema: "./prisma/schema.prisma",
  datasource: {
    // На Vercel эти переменные подтянутся из настроек проекта
    url: process.env.POSTGRES_PRISMA_URL || process.env.DATABASE_URL,
    directUrl: process.env.POSTGRES_URL_NON_POOLING
  },
});
