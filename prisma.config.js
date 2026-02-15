import { defineConfig } from '@prisma/config';

export default defineConfig({
  datasource: {
    url: process.env.DIRECT_URL, // Для миграций и интроспекции (unpooled)
  },
});
