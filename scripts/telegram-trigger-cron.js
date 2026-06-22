#!/usr/bin/env node
/**
 * Trigger telegram-daily cron locally (works on Windows PowerShell — no curl -H).
 *
 * Usage:
 *   node --env-file=.env.local scripts/telegram-trigger-cron.js morning
 *   node --env-file=.env.local scripts/telegram-trigger-cron.js evening
 *   $env:CRON_BASE_URL="http://localhost:3000"; node --env-file=.env.local scripts/telegram-trigger-cron.js morning
 */

import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

function loadEnvLocal() {
  const path = join(root, '.env.local');
  if (!existsSync(path)) return;
  for (const line of readFileSync(path, 'utf8').split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    const val = trimmed.slice(eq + 1).trim();
    if (!process.env[key]) process.env[key] = val;
  }
}

loadEnvLocal();

const slotArg = (process.argv[2] || 'morning').toLowerCase();
const slot = slotArg === 'evening' ? 'evening' : 'morning';
const secret = (process.env.CRON_SECRET || '').trim();
const base = (process.env.CRON_BASE_URL || 'http://localhost:3000').replace(/\/$/, '');

if (!secret) {
  console.error('CRON_SECRET is missing. Add it to .env.local or pass --env-file=.env.local');
  process.exit(1);
}

const url = `${base}/api/cron/telegram-daily?slot=${slot}`;

console.log(`POST ${url}`);

let res;
try {
  res = await fetch(url, {
    headers: { Authorization: `Bearer ${secret}` },
  });
} catch (err) {
  const code = err?.cause?.code || err?.code;
  if (code === 'ECONNREFUSED' || code === 'EACCES') {
    console.error(`Cannot reach ${base} — start the dev server first: npm run dev`);
    console.error('Or set CRON_BASE_URL=https://stratumielts.com for production.');
  } else {
    console.error(err?.message || err);
  }
  process.exit(1);
}

const body = await res.text();
let json;
try {
  json = JSON.parse(body);
} catch {
  json = { raw: body };
}

console.log(`Status: ${res.status}`);
console.log(JSON.stringify(json, null, 2));

if (!res.ok) process.exit(1);
