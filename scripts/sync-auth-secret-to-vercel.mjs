import fs from 'fs';
import { spawnSync } from 'child_process';

function parseEnv(path) {
  const out = {};
  if (!fs.existsSync(path)) {
    throw new Error(`Missing ${path}`);
  }
  for (const line of fs.readFileSync(path, 'utf8').split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq);
    let value = trimmed.slice(eq + 1);
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    out[key] = value;
  }
  return out;
}

function runVercel(args, input, opts = {}) {
  const result = spawnSync('npx', ['vercel', ...args], {
    input,
    encoding: 'utf8',
    stdio: ['pipe', 'pipe', 'pipe'],
    shell: true,
  });
  if (result.status !== 0 && !opts.allowFail) {
    const detail = (result.stderr || result.stdout || '').trim();
    throw new Error(`vercel ${args.join(' ')} failed: ${detail}`);
  }
  return (result.stdout || '').trim();
}

function upsertEnv(name, value, environments) {
  for (const env of environments) {
    runVercel(['env', 'rm', name, env, '--yes'], null, { allowFail: true });
    runVercel(['env', 'add', name, env], value);
    console.log(`Updated ${name} for ${env}`);
  }
}

const local = parseEnv('.env.local');
const authSecret = (local.AUTH_SECRET || local.NEXTAUTH_SECRET || '').trim();
if (!authSecret || authSecret.length < 16) {
  throw new Error('AUTH_SECRET is missing or too short in .env.local');
}

const targets = ['production', 'preview', 'development'];
upsertEnv('AUTH_SECRET', authSecret, targets);

console.log('AUTH_SECRET synced from .env.local to Vercel.');
