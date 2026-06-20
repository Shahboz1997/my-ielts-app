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
    resolveFacebookPageCredentials,
    probeFacebookPhotoPost,
    FACEBOOK_TOKEN_SETUP_HINT,
  } = await import('../src/lib/facebook.js');

  console.log('=== Facebook token check ===\n');

  if (!process.env.FACEBOOK_USER_ACCESS_TOKEN?.trim()) {
    console.log('ℹ️  FACEBOOK_USER_ACCESS_TOKEN not set — using FACEBOOK_ACCESS_TOKEN only.\n');
  }

  const creds = await resolveFacebookPageCredentials();
  if ('error' in creds) {
    console.error('❌', creds.error);
    console.log('\n--- How to fix ---\n   ' + FACEBOOK_TOKEN_SETUP_HINT);
    process.exit(1);
  }

  console.log('✅ Page:', creds.pageName);
  console.log('✅ Page ID:', creds.pageId);
  console.log('✅ Token prefix:', creds.accessToken.slice(0, 12) + '…');

  const probe = await probeFacebookPhotoPost(creds.pageId, creds.accessToken);
  if (!probe.ok) {
    console.error('\n❌ Cannot post:', probe.error);
    console.log('\n--- How to fix ---\n   ' + FACEBOOK_TOKEN_SETUP_HINT);
    process.exit(1);
  }

  console.log('✅ Photo post works! probe id:', probe.postId);
  console.log('\nRun full test: node --env-file=.env.local scripts/facebook-send-test.js');
}

main().catch((err) => {
  console.error(err?.message || err);
  process.exit(1);
});
