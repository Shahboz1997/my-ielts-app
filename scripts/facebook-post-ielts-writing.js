#!/usr/bin/env node
/**
 * Local: generate IELTS Writing banner + publish to Facebook Page.
 *
 * Usage:
 *   node --env-file=.env.local scripts/facebook-post-ielts-writing.js
 *   node --env-file=.env.local scripts/facebook-post-ielts-writing.js --variant=2
 *
 * Production (recommended):
 *   curl -H "Authorization: Bearer $CRON_SECRET" \
 *     "https://stratumielts.com/api/cron/facebook-post?variant=1"
 */

import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

function loadEnvLocal() {
  const path = join(root, '.env.local');
  if (!existsSync(path)) {
    console.error('.env.local not found');
    process.exit(1);
  }
  for (const line of readFileSync(path, 'utf8').split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq === -1) continue;
    process.env[trimmed.slice(0, eq).trim()] = trimmed.slice(eq + 1).trim();
  }
}

function getVariant() {
  const arg = process.argv.find((a) => a.startsWith('--variant='));
  const n = arg ? Number(arg.split('=')[1]) : 1;
  return [1, 2].includes(n) ? n : 1;
}

async function main() {
  loadEnvLocal();
  const variant = getVariant();

  const { getWritingFacebookPost } = await import('../src/lib/facebookPostContent.js');
  const { publishWritingPostToFacebook } = await import('../src/lib/facebookPublish.js');
  const { validateFacebookPageCredentials, cleanBrokenTlsEnv } = await import('../src/lib/facebook.js');

  const { prompt } = getWritingFacebookPost(variant);
  console.log(`\n=== Image prompt (variant ${variant}) ===\n${prompt}\n`);

  cleanBrokenTlsEnv();

  const validation = await validateFacebookPageCredentials();
  if (!validation.ok) {
    console.error('Token cannot publish:', validation.error);
    if (validation.hint) console.log('\n--- How to fix ---\n', validation.hint);
    process.exit(1);
  }

  console.log('[facebook-post] Page:', validation.creds.pageName, validation.creds.pageId);
  console.log('[facebook-post] Generating image + publishing…');

  const result = await publishWritingPostToFacebook({ variant });
  if (!result.success) {
    console.error('[facebook-post] Failed:', result.error);
    process.exit(1);
  }

  console.log('\n✅ Facebook post published! id:', result.facebookPostId);
}

main().catch((err) => {
  console.error('❌', err?.message || err);
  process.exit(1);
});
