import "dotenv/config";
import * as prismaConfig from "@prisma/config";

export default prismaConfig.defineConfig({
  schema: "./prisma/schema.prisma",
  datasource: {
    url: process.env.POSTGRES_URL_NON_POOLING,
  },
});
