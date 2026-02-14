import "dotenv/config";
import { defineConfig } from "@prisma/config";

export default defineConfig({
  schema: "./prisma/schema.prisma",
  datasource: {
    // Prisma 7 ожидает эти ключи здесь
    url: process.env.POSTGRES_PRISMA_URL,
  },
});
