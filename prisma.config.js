import "dotenv/config";
import { config } from "dotenv";
import path from "path";
import { defineConfig } from "prisma/config";

const root = process.cwd();
config({ path: path.join(root, ".env") });
config({ path: path.join(root, ".env.local"), override: true });

const isCiLike =
  process.env.VERCEL === "1" ||
  process.env.CI === "true" ||
  process.env.CI === "1";

/** Prisma schema-engine (Rust) — SSL/timeouts for Supabase Session pooler on Windows. */
function normalizePrismaCliUrl(raw) {
  const input = String(raw || "").trim();
  if (!input) return input;

  try {
    const u = new URL(input.replace(/^postgresql:/i, "postgres:"));

    if (!u.searchParams.has("connect_timeout")) {
      u.searchParams.set("connect_timeout", "60");
    }
    if (!u.searchParams.has("sslmode")) {
      const host = (u.hostname || "").toLowerCase();
      const isLocal = host === "localhost" || host === "127.0.0.1" || host === "::1";
      u.searchParams.set("sslmode", isLocal ? "disable" : "require");
    }

    return u.toString().replace(/^postgres:/i, "postgresql:");
  } catch {
    return input;
  }
}

let url = normalizePrismaCliUrl(
  (process.env.DIRECT_URL || process.env.DATABASE_URL || "").trim()
);

const shadowRaw = (process.env.SHADOW_DATABASE_URL || "").trim();
const shadowDatabaseUrl = shadowRaw ? normalizePrismaCliUrl(shadowRaw) : undefined;

if (!url) {
  if (isCiLike) {
    url =
      "postgresql://prisma_build_placeholder:prisma_build_placeholder@127.0.0.1:5432/prisma_build?schema=public";
  } else {
    throw new Error(
      "Prisma: set DIRECT_URL (Session pooler :5432) in .env.local. Supabase Dashboard → Connect → Session pooler."
    );
  }
}

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    // Session pooler (5432) for migrate / db push / status
    url,
    ...(shadowDatabaseUrl ? { shadowDatabaseUrl } : {}),
  },
});
