#!/usr/bin/env node
/**
 * Manual test: OpenAI banner + Facebook photo post.
 *
 * Usage (from project root):
 *   node --env-file=.env.local scripts/facebook-send-test.js
 */

import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

/** Force-load .env.local (overrides empty shell vars that block --env-file). */
function loadEnvLocal() {
  const path = join(root, '.env.local');
  if (!existsSync(path)) {
    console.error('[facebook-send-test] .env.local not found');
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
      console.warn(`[facebook-send-test] Duplicate ${key} in .env.local — using last value`);
    }
    seen.add(key);
    let val = trimmed.slice(eq + 1).trim();
    const commentIdx = val.indexOf(' #');
    if (commentIdx !== -1) val = val.slice(0, commentIdx).trim();
    process.env[key] = val;
  }
}

function requireEnv(name) {
  const val = (process.env[name] || '').trim();
  if (!val) {
    console.error(`[facebook-send-test] Missing ${name} in .env.local — save the file (Ctrl+S) and retry`);
    process.exit(1);
  }
  return val;
}

const TEST_CAPTION =
  'Testing automatic AI integration from Stratum IELTS. Image generation and cross-posting is fully functional! 🚀';

const BANNER_TOPIC = 'IELTS writing practice — STRATUM integration test';

async function main() {
  loadEnvLocal();
  requireEnv('OPENAI_API_KEY');
  requireEnv('FACEBOOK_PAGE_ID');
  requireEnv('FACEBOOK_ACCESS_TOKEN');

  console.log('[facebook-send-test] Loading modules…');

  const { generatePostBanner } = await import('../src/lib/facebookImageGen.js');
  const { postImageToFacebookPage, validateFacebookPageCredentials, cleanBrokenTlsEnv } =
    await import('../src/lib/facebook.js');

  cleanBrokenTlsEnv();

  const validation = await validateFacebookPageCredentials();
  if (!validation.ok) {
    console.error('[facebook-send-test] Token cannot publish:', validation.error);
    if (validation.hint) {
      console.log('\n--- How to fix ---\n   ' + validation.hint);
    }
    process.exit(1);
  }

  console.log('[facebook-send-test] Page:', validation.creds.pageName, validation.creds.pageId);

  console.log('[facebook-send-test] Generating test banner via OpenAI Images…');
  const image = await generatePostBanner(BANNER_TOPIC);
  console.log('[facebook-send-test] Image ready — posting immediately');

  console.log('[facebook-send-test] Publishing to Facebook Page…');
  const result = await postImageToFacebookPage(image, TEST_CAPTION);

  if (!result.success) {
    console.error('[facebook-send-test] Failed:', JSON.stringify(result.error, null, 2));
    process.exit(1);
  }

  console.log('[facebook-send-test] Success! Post id:', result.id);
}

main().catch((err) => {
  const cause = err?.cause?.code || err?.cause?.message;
  console.error('[facebook-send-test]', err?.message || err);
  if (cause) console.error('[facebook-send-test] cause:', cause);
  process.exit(1);
});
