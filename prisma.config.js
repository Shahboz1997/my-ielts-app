import { defineConfig } from '@prisma/config';

export default defineConfig({
  datasource: {
    // Для работы приложения используем URL с пулером (DATABASE_URL)
    url: process.env.DATABASE_URL,
    // Для миграций и сборки используем прямой URL (DIRECT_URL)
    directUrl: process.env.DIRECT_URL,
  },
});
