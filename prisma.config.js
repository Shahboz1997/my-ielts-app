import { defineConfig } from '@prisma/config';

export default defineConfig({
  schema: './prisma/schema.prisma',
  datasource: {
    // Добавили &pgbouncer=true в конец
    url: "postgresql://neondb_owner:npg_rsjJoU69zQup@ep-falling-heart-aikuyfnd-pooler.c-4.us-east-1.aws.neon.tech/neondb?sslmode=require&pgbouncer=true",
  },
});
