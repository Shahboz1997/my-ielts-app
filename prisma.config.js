import "dotenv/config";
import { config } from "dotenv";
import path from "path";
import { defineConfig } from "prisma/config";

const root = process.cwd();
config({ path: path.join(root, ".env") });
config({ path: path.join(root, ".env.local"), override: true });

const url = process.env.DIRECT_URL || process.env.DATABASE_URL;
if (!url) {
  throw new Error(
    "Prisma config error: set DIRECT_URL or DATABASE_URL (e.g. in Vercel project env vars)."
  );
}

export default defineConfig({
  datasource: {
    // Use DIRECT_URL for migrations (direct connection, not pooler)
    // Falls back to DATABASE_URL if DIRECT_URL is not set
    url,
  },
});
