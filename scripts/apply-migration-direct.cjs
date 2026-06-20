/**
 * Apply a single migration via direct Supabase host when session pooler is flaky.
 * Usage: node scripts/apply-migration-direct.js [migration_folder_name]
 */
const fs = require('fs');
const path = require('path');
const { Client } = require('pg');
const crypto = require('crypto');

require('dotenv').config({ path: path.join(process.cwd(), '.env') });
require('dotenv').config({ path: path.join(process.cwd(), '.env.local'), override: true });

const migrationName =
  process.argv[2] || '20260607120000_remove_telegram_reminders';

function directConnectionString() {
  const raw = (process.env.DIRECT_URL || process.env.DATABASE_URL || '').trim();
  if (!raw) throw new Error('Set DIRECT_URL or DATABASE_URL in .env.local');

  let url = raw;
  if (!/\buselibpqcompat=true\b/i.test(url) && /\bsslmode=(?:require|prefer|verify-ca)\b/i.test(url)) {
    url = url.includes('?') ? `${url}&uselibpqcompat=true` : `${url}?uselibpqcompat=true`;
  }

  const u = new URL(url.replace(/^postgresql:/i, 'postgres:'));
  u.searchParams.delete('pgbouncer');
  if (!u.searchParams.has('connect_timeout')) u.searchParams.set('connect_timeout', '60');

  return u.toString().replace(/^postgres:/i, 'postgresql:');
}

async function main() {
  const sqlPath = path.join(
    process.cwd(),
    'prisma/migrations',
    migrationName,
    'migration.sql'
  );
  if (!fs.existsSync(sqlPath)) {
    throw new Error(`Migration not found: ${sqlPath}`);
  }

  const sql = fs.readFileSync(sqlPath, 'utf8');
  const checksum = crypto.createHash('sha256').update(sql).digest('hex');
  const conn = directConnectionString();
  const host = new URL(conn.replace(/^postgresql:/i, 'postgres:')).hostname;

  const client = new Client({
    connectionString: conn,
    connectionTimeoutMillis: 60000,
    ssl: { rejectUnauthorized: false },
  });

  await client.connect();
  console.log(`Connected to ${host}`);

  const existing = await client.query(
    'SELECT finished_at FROM "_prisma_migrations" WHERE migration_name = $1 LIMIT 1',
    [migrationName]
  );
  if (existing.rows[0]?.finished_at) {
    console.log(`Already applied: ${migrationName}`);
    await client.end();
    return;
  }

  await client.query('BEGIN');
  try {
    await client.query(sql);
    await client.query(
      `INSERT INTO "_prisma_migrations"
        (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count)
       VALUES ($1, $2, NOW(), $3, NULL, NULL, NOW(), 1)`,
      [crypto.randomUUID(), checksum, migrationName]
    );
    await client.query('COMMIT');
    console.log(`Applied: ${migrationName}`);
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    await client.end();
  }
}

main().catch((err) => {
  console.error(err?.message || err);
  process.exit(1);
});
