import "dotenv/config";
import { config } from "dotenv";
import path from "path";
import { defineConfig, env } from "prisma/config";

const root = process.cwd();
config({ path: path.join(root, ".env") });
config({ path: path.join(root, ".env.local"), override: true });

export default defineConfig({
  datasource: {
    // Use DIRECT_URL for migrations (direct connection, not pooler)
    // Falls back to DATABASE_URL if DIRECT_URL is not set
    url: env("DIRECT_URL") || env("DATABASE_URL"),
  },
});
