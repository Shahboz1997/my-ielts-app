import dns from "node:dns";
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

const globalForPrisma = globalThis;

function isSupabaseCloudHost(url) {
  return /supabase\.(com|co)\b/i.test(String(url ?? ""));
}

/**
 * Prefer IPv4 for DB connections when:
 * - explicit PG_IPV4_FIRST=1, or Windows dev (IPv6 hangs on some LANs), or
 * - Vercel + Supabase (intermittent IPv6 / routing → RST / ERR_CONNECTION_CLOSED during cold OAuth).
 */
function preferIpv4ForDatabase(connectionString) {
  if (process.env.PG_IPV4_FIRST === "0") return false;
  if (process.env.PG_IPV4_FIRST === "1") return true;
  if (process.platform === "win32") return true;
  if (
    process.env.VERCEL === "1" &&
    connectionString &&
    isSupabaseCloudHost(connectionString)
  ) {
    return true;
  }
  return false;
}

const earlyDbUrl = (
  process.env.PRISMA_RUNTIME_DATABASE_URL ||
  process.env.DATABASE_URL ||
  process.env.DIRECT_URL ||
  ""
).trim();

if (typeof dns.setDefaultResultOrder === "function" && preferIpv4ForDatabase(earlyDbUrl)) {
  dns.setDefaultResultOrder("ipv4first");
}

function patchDnsLookupForSupabase() {
  if (globalForPrisma.__supabaseDnsPatched) return;
  globalForPrisma.__supabaseDnsPatched = true;

  const originalLookup = dns.lookup.bind(dns);

  dns.lookup = (hostname, options, callback) => {
    let opts = options;
    let cb = callback;
    if (typeof opts === "function") {
      cb = opts;
      opts = {};
    } else if (typeof opts === "number") {
      cb = callback;
      opts = { family: opts };
    }
    opts = opts || {};

    const finish = (err, address, family) => {
      if (err?.code === "EAI_AGAIN") {
        const retry = (left) => {
          originalLookup(hostname, opts, (retryErr, retryAddress, retryFamily) => {
            if (retryErr?.code === "EAI_AGAIN" && left > 0) {
              setTimeout(() => retry(left - 1), 120 + Math.random() * 180);
              return;
            }
            cb(retryErr, retryAddress, retryFamily);
          });
        };
        retry(3);
        return;
      }
      cb(err, address, family);
    };

    if (/^db\.[^.]+\.supabase\.co$/i.test(String(hostname || ""))) {
      originalLookup(hostname, { ...opts, verbatim: false }, finish);
      return;
    }

    originalLookup(hostname, opts, finish);
  };
}

patchDnsLookupForSupabase();

function shouldForceIpv4(connectionString) {
  if (!preferIpv4ForDatabase(connectionString)) return false;
  // Supabase direct DB hostnames are often IPv6-only; family:4 → EAI_AGAIN on Windows.
  if (/[@/]db\.[^./]+\.supabase\.co/i.test(connectionString || "")) return false;
  return true;
}

/**
 * Supabase **Transaction** pooler (port 6543 / *.pooler.supabase.com) + Prisma: add `pgbouncer=true`
 * if missing (see Supabase “Connect to Postgres” → Prisma). Avoid **Session** pooler for Prisma app traffic.
 */
function normalizeSupabasePooledUrl(url) {
  if (!url || !isSupabaseCloudHost(url)) return url;
  const looksLikeTxnPooler =
    /:\s*6543\b/i.test(url) ||
    /\.pooler\.supabase\.com/i.test(url) ||
    /pooler\.supabase\.com/i.test(url);
  if (looksLikeTxnPooler && !/[?&]pgbouncer=true\b/i.test(url)) {
    return url.includes("?") ? `${url}&pgbouncer=true` : `${url}?pgbouncer=true`;
  }
  return url;
}

/**
 * If the URI has no `/dbname` before the query string, libpq/pg defaults the database name
 * to the username. Supabase pooler usernames are `postgres.<project-ref>` → bogus DB
 * `postgres.xxx` and error 3D000. Always use database `postgres` when path is omitted.
 */
function ensureSupabaseDefaultDatabase(connectionString) {
  if (!connectionString || !isSupabaseCloudHost(connectionString)) {
    return connectionString;
  }
  try {
    const u = new URL(connectionString);
    const db = (u.pathname || "").replace(/^\//, "").split("/")[0];
    if (db) return connectionString;
    u.pathname = "/postgres";
    return u.toString();
  } catch {
    return connectionString;
  }
}

/**
 * Recent pg / pg-connection-string versions may treat sslmode=require/prefer/verify-ca as aliases for verify-full,
 * which breaks Supabase/Neon chains on many dev machines (self-signed / missing intermediate CA).
 * Opt into libpq-compatible semantics when the URL explicitly requests sslmode=require.
 */
function ensureLibpqCompatSslMode(connectionString) {
  if (!connectionString) return connectionString;
  // Only adjust when sslmode is explicitly set to a "non-verify-full" value.
  if (!/\bsslmode=(?:require|prefer|verify-ca)\b/i.test(connectionString)) return connectionString;
  if (/\buselibpqcompat=true\b/i.test(connectionString)) return connectionString;
  return connectionString.includes("?")
    ? `${connectionString}&uselibpqcompat=true`
    : `${connectionString}?uselibpqcompat=true`;
}

function resolveRuntimeDatabaseUrl() {
  const override = (process.env.PRISMA_RUNTIME_DATABASE_URL || "").trim();
  if (override) return override;

  const database = (process.env.DATABASE_URL || "").trim();
  const direct = (process.env.DIRECT_URL || "").trim();
  return database || direct;
}

function createPgPool() {
  // PRISMA_RUNTIME_DATABASE_URL overrides everything (e.g. force transaction pooler only).
  // Supabase: use DATABASE_URL = **Transaction** pooler URI for the app; DIRECT_URL = direct (migrations).
  // Prefer DATABASE_URL before DIRECT_URL so PrismaAdapter does not saturate the small direct pool.
  let connectionString = resolveRuntimeDatabaseUrl();
  connectionString = normalizeSupabasePooledUrl(connectionString);
  connectionString = ensureSupabaseDefaultDatabase(connectionString);
  connectionString = ensureLibpqCompatSslMode(connectionString);
  const isTcpLocal = /localhost|127\.0\.0\.1|@127\.0\.0\.1|@localhost/i.test(
    connectionString || ""
  );

  // verify-full in production for generic Postgres; skip for Supabase hosts — upgrading sslmode here combined with
  // Pool TLS options caused intermittent handshake failures / dropped connections on some hosted setups (OAuth callbacks).
  if (
    !isTcpLocal &&
    connectionString &&
    process.env.NODE_ENV === "production" &&
    !isSupabaseCloudHost(connectionString)
  ) {
    connectionString = connectionString.replace(
      /\bsslmode=(?:prefer|require|verify-ca)\b/i,
      "sslmode=verify-full"
    );
  }

  /** PgBouncer / Supabase pooler: avoid passing custom startup GUCs via Pool `options` (can drop connections). */
  function poolSsl(cs) {
    if (!cs || isTcpLocal) return undefined;
    if (/\bsslmode=verify-full\b/i.test(cs)) return { rejectUnauthorized: true };
    if (/\bsslmode=/i.test(cs)) return { rejectUnauthorized: false };
    if (
      /neon\.tech|supabase\.(com|co)\b|pooler\.|\.pooler\.|amazonaws\.com|rds\.amazonaws\.com/i.test(
        cs
      )
    ) {
      return { rejectUnauthorized: false };
    }
    return undefined;
  }

  // OAuth + PrismaAdapter: allow cold Supabase / TLS; cap dev waits so localhost does not hang ~60s.
  const defaultConnectMs = process.env.NODE_ENV === "development" ? 15_000 : 60_000;
  const ms = Math.max(
    3_000,
    Number.parseInt(process.env.PG_CONNECT_TIMEOUT_MS || String(defaultConnectMs), 10) ||
      defaultConnectMs
  );
  const defaultPoolMax = isSupabaseCloudHost(connectionString) ? 5 : 10;
  const max = Math.min(
    50,
    Math.max(
      1,
      Number.parseInt(process.env.PG_POOL_MAX || String(defaultPoolMax), 10) ||
        defaultPoolMax
    )
  );

  const preferIpv4 = !isTcpLocal && shouldForceIpv4(connectionString);
  const useResilientLookup =
    !isTcpLocal &&
    (preferIpv4 || isSupabaseCloudHost(connectionString));

  return new Pool({
    connectionString,
    ssl: poolSsl(connectionString),
    max,
    ...(preferIpv4 ? { family: 4 } : {}),
    ...(useResilientLookup ? { lookup: createResilientLookup(preferIpv4) } : {}),
    // Recycle clients before hosted poolers close them server-side → fewer Prisma P1017 ("Server has closed the connection").
    maxUses: Math.max(
      50,
      Number.parseInt(process.env.PG_POOL_MAX_USES || "250", 10) || 250
    ),
    // Default pg-pool idle reap (10s) + PrismaPg can drop all clients when idle → reconnect storms / checkout timeouts.
    idleTimeoutMillis: 300_000,
    connectionTimeoutMillis: ms,
  });
}

function createPrismaClient() {
  const pool = globalForPrisma.pgPool ?? createPgPool();
  if (!globalForPrisma.pgPool) globalForPrisma.pgPool = pool;

  const adapter = new PrismaPg(pool);
  return new PrismaClient({ adapter });
}

export function getPrisma() {
  if (!globalForPrisma.prisma) {
    globalForPrisma.prisma = createPrismaClient();
  }
  return globalForPrisma.prisma;
}

/** Serialized teardown so concurrent requests do not create a new pool while the old one is still ending. */
let resetPrismaChain = Promise.resolve();

/**
 * Close Prisma + pg Pool (e.g. after P1017). Next getPrisma() builds a fresh pool.
 */
export function resetPrismaClients() {
  resetPrismaChain = resetPrismaChain.then(async () => {
    const prisma = globalForPrisma.prisma;
    const pool = globalForPrisma.pgPool;
    globalForPrisma.prisma = undefined;
    globalForPrisma.pgPool = undefined;
    if (prisma) {
      await prisma.$disconnect().catch(() => {});
    }
    if (pool) {
      await pool.end().catch(() => {});
    }
  });
  return resetPrismaChain;
}

const TRANSIENT_PRISMA_CODES = new Set(["P1017", "P1001", "P1008", "P2024"]);

const TRANSIENT_NETWORK_CODES = new Set([
  "EAI_AGAIN",
  "ENOTFOUND",
  "ETIMEDOUT",
  "ECONNRESET",
  "ECONNREFUSED",
  "EHOSTUNREACH",
  "ENETUNREACH",
  "EPIPE",
]);

function isTransientDbError(error) {
  if (!error) return false;

  const codes = [error.code, error.cause?.code, error.meta?.code].filter(Boolean);
  if (codes.some((code) => TRANSIENT_PRISMA_CODES.has(code))) return true;
  if (codes.some((code) => TRANSIENT_NETWORK_CODES.has(code))) return true;

  const message = String(error.message || "");
  return /getaddrinfo EAI_AGAIN|getaddrinfo ENOTFOUND|connection terminated|Server has closed the connection|Connection terminated unexpectedly|Can't reach database server|timeout exceeded when trying to connect/i.test(
    message
  );
}

function retryDelayMs(error, attemptIndex) {
  const code = error?.code || error?.cause?.code;
  if (code === "EAI_AGAIN" || /getaddrinfo EAI_AGAIN/i.test(String(error?.message || ""))) {
    return 250 + 400 * attemptIndex;
  }
  return 80 + 120 * attemptIndex;
}

/**
 * Windows / some LANs: intermittent DNS (EAI_AGAIN) on Supabase pooler hosts.
 * Direct db.*.supabase.co hosts: resolve6 first (IPv4-only lookup often fails).
 */
function createResilientLookup(preferIpv4) {
  return (hostname, options, callback) => {
    const finish = (err, address, family) => {
      if (err?.code === "EAI_AGAIN") {
        const baseOpts = { ...(options || {}), verbatim: false };
        const lookupOpts = preferIpv4 ? { ...baseOpts, family: 4 } : baseOpts;
        const run = (retriesLeft) => {
          dns.lookup(hostname, lookupOpts, (lookupErr, lookupAddress, lookupFamily) => {
            if (lookupErr?.code === "EAI_AGAIN" && retriesLeft > 0) {
              setTimeout(() => run(retriesLeft - 1), 120 + Math.random() * 180);
              return;
            }
            callback(lookupErr, lookupAddress, lookupFamily);
          });
        };
        run(3);
        return;
      }
      callback(err, address, family);
    };

    if (/^db\.[^.]+\.supabase\.co$/i.test(hostname)) {
      dns.promises
        .resolve6(hostname)
        .then((addresses) => {
          if (!addresses?.length) {
            finish(Object.assign(new Error(`no AAAA for ${hostname}`), { code: "ENOTFOUND" }));
            return;
          }
          callback(null, addresses[0], 6);
        })
        .catch((err) => finish(err));
      return;
    }

    const baseOpts = { ...(options || {}), verbatim: false };
    const lookupOpts = preferIpv4 ? { ...baseOpts, family: 4 } : baseOpts;
    const run = (retriesLeft) => {
      dns.lookup(hostname, lookupOpts, (err, address, family) => {
        if (err?.code === "EAI_AGAIN" && retriesLeft > 0) {
          setTimeout(() => run(retriesLeft - 1), 120 + Math.random() * 180);
          return;
        }
        callback(err, address, family);
      });
    };
    run(3);
  };
}

/**
 * Retry DB work when the pool returns a connection the server already closed (common with Supabase transaction pooler).
 */
export async function withPrismaRetry(operation, opts = {}) {
  const attempts = Math.max(1, Number(opts.attempts) || 4);
  let lastError;
  for (let i = 0; i < attempts; i++) {
    try {
      return await operation();
    } catch (e) {
      lastError = e;
      if (!isTransientDbError(e)) throw e;
      if (i === attempts - 1) throw e;
      await resetPrismaClients();
      await new Promise((r) => setTimeout(r, retryDelayMs(e, i)));
    }
  }
  throw lastError;
}

