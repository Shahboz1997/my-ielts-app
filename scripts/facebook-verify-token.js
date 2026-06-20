#!/usr/bin/env node
/**
 * Validate Facebook Page token before cross-posting.
 *
 * Usage:
 *   node --env-file=.env.local scripts/facebook-verify-token.js
 */

import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

function loadEnvLocal() {
  const path = join(root, '.env.local');
  if (!existsSync(path)) {
    console.error('❌ .env.local not found');
    process.exit(1);
  }
  const seen = new Set();
  for (const line of readFileSync(path, 'utf8').split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    if (seen.has(key)) {
      console.warn(`⚠️  Duplicate key in .env.local (last wins): ${key}`);
    }
    seen.add(key);
    let val = trimmed.slice(eq + 1).trim();
    const commentIdx = val.indexOf(' #');
    if (commentIdx !== -1) val = val.slice(0, commentIdx).trim();
    process.env[key] = val;
  }
}

async function main() {
  loadEnvLocal();

  const {
    validateFacebookPageCredentials,
    FACEBOOK_TOKEN_SETUP_HINT,
    cleanBrokenTlsEnv,
  } = await import('../src/lib/facebook.js');

  cleanBrokenTlsEnv();

  console.log('=== Facebook token check ===\n');

  if (!process.env.FACEBOOK_APP_SECRET?.trim()) {
    console.log('⚠️  FACEBOOK_APP_SECRET missing — tokens may expire in ~1 hour instead of ~60 days.\n');
  }

  if (!process.env.FACEBOOK_USER_ACCESS_TOKEN?.trim()) {
    console.log('ℹ️  FACEBOOK_USER_ACCESS_TOKEN not set — using FACEBOOK_ACCESS_TOKEN only.\n');
  }

  const validation = await validateFacebookPageCredentials();
  if (!validation.ok) {
    console.error('❌', validation.error);
    if (/Network timeout|Cannot reach|SSL\/TLS error/i.test(validation.error || '')) {
      console.log(
        '\n--- Network ---\n' +
          '   graph.facebook.com is unreachable from this PC (VPN/firewall/antivirus).\n' +
          '   Enable VPN and retry, or trigger production on Vercel:\n' +
          '   curl -H "Authorization: Bearer $CRON_SECRET" "https://stratumielts.com/api/cron/facebook-post?variant=1"'
      );
    } else if (validation.hint) {
      console.log('\n--- How to fix ---\n   ' + validation.hint);
    } else {
      console.log('\n--- How to fix ---\n   ' + FACEBOOK_TOKEN_SETUP_HINT);
    }
    process.exit(1);
  }

  console.log('✅ Page:', validation.creds.pageName);
  console.log('✅ Page ID:', validation.creds.pageId);
  console.log('✅ Token prefix:', validation.creds.accessToken.slice(0, 12) + '…');
  console.log('\nPublish IELTS Writing post (local):');
  console.log('   node --env-file=.env.local scripts/facebook-post-ielts-writing.js');
  console.log('\nPublish via Vercel (after deploy):');
  console.log(
    '   curl -H "Authorization: Bearer $CRON_SECRET" "https://stratumielts.com/api/cron/facebook-post?variant=1"'
  );
}

main().catch((err) => {
  console.error(err?.message || err);
  process.exit(1);
});
