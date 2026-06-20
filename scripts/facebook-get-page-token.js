#!/usr/bin/env node
/**
 * Exchange User token → long-lived User token (~60 days) → non-expiring Page token.
 * Writes .env.local and prints Vercel sync commands.
 *
 * Prerequisites:
 *   FACEBOOK_APP_ID + FACEBOOK_APP_SECRET (Meta App → Settings → Basic)
 *   Fresh USER token in Graph API Explorer with pages_manage_posts
 *
 * Usage:
 *   node --env-file=.env.local scripts/facebook-get-page-token.js
 *   node --env-file=.env.local scripts/facebook-get-page-token.js <USER_TOKEN>
 */

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { debugAccessToken, refreshFacebookTokens } from '../src/lib/facebookToken.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const ENV_PATH = join(root, '.env.local');
const REQUIRED = ['pages_show_list', 'pages_read_engagement', 'pages_manage_posts'];

function loadEnvLocal() {
  if (!existsSync(ENV_PATH)) return;
  for (const line of readFileSync(ENV_PATH, 'utf8').split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq === -1) continue;
    process.env[trimmed.slice(0, eq).trim()] = trimmed.slice(eq + 1).trim();
  }
}

function updateEnvLocal(updates) {
  let content = readFileSync(ENV_PATH, 'utf8');
  for (const [key, value] of Object.entries(updates)) {
    const re = new RegExp(`^${key}=.*$`, 'm');
    if (re.test(content)) {
      content = content.replace(re, `${key}=${value}`);
    } else {
      content = `${content.trimEnd()}\n${key}=${value}\n`;
    }
  }
  writeFileSync(ENV_PATH, content, 'utf8');
}

function formatExpiry(ms) {
  if (!ms) return 'never (Page token from long-lived User token)';
  return new Date(ms).toISOString();
}

async function getGrantedPermissions(token) {
  const res = await fetch(
    `https://graph.facebook.com/v21.0/me/permissions?access_token=${encodeURIComponent(token)}`
  );
  const data = await res.json().catch(() => ({}));
  if (!Array.isArray(data?.data)) return [];
  return data.data.filter((p) => p.status === 'granted').map((p) => p.permission);
}

async function main() {
  loadEnvLocal();

  const userTokenArg = (process.argv[2] || process.env.FACEBOOK_USER_ACCESS_TOKEN || '').trim();
  if (!userTokenArg) {
    console.error('Set FACEBOOK_USER_ACCESS_TOKEN in .env.local or pass as argument.');
    process.exit(1);
  }

  const appSecret = (process.env.FACEBOOK_APP_SECRET || '').trim();
  if (!appSecret) {
    console.warn('⚠️  FACEBOOK_APP_SECRET is missing — Page token may expire quickly.');
    console.warn('   Add it from Meta App → Settings → Basic for ~60-day User tokens.\n');
  }

  const granted = await getGrantedPermissions(userTokenArg);
  const missing = REQUIRED.filter((p) => !granted.includes(p));
  if (missing.length) {
    console.error(`❌ Token missing permissions: ${missing.join(', ')}`);
    console.log('\nGraph API Explorer → User token → add pages_manage_posts → regenerate');
    process.exit(1);
  }

  console.log('=== Refreshing Facebook tokens ===\n');

  const refreshed = await refreshFacebookTokens(userTokenArg);
  const userDebug = await debugAccessToken(refreshed.userAccessToken);

  console.log(`✅ Page: ${refreshed.pageName} (${refreshed.pageId})`);
  console.log(`   User token expires: ${formatExpiry(userDebug.expiresAt)}`);
  console.log(`   Page token: non-expiring (when issued from long-lived User token)\n`);

  if (existsSync(ENV_PATH)) {
    updateEnvLocal({
      FACEBOOK_PAGE_ID: refreshed.pageId,
      FACEBOOK_ACCESS_TOKEN: refreshed.pageAccessToken,
      FACEBOOK_USER_ACCESS_TOKEN: refreshed.userAccessToken,
      FACEBOOK_USE_AI: '1',
    });
    console.log('✅ .env.local updated\n');
  }

  console.log('=== Copy to Vercel → Settings → Environment Variables (Production) ===\n');
  console.log(`FACEBOOK_PAGE_ID=${refreshed.pageId}`);
  console.log(`FACEBOOK_ACCESS_TOKEN=${refreshed.pageAccessToken}`);
  console.log(`FACEBOOK_USER_ACCESS_TOKEN=${refreshed.userAccessToken}`);
  if (appSecret) console.log(`FACEBOOK_APP_SECRET=${appSecret}`);
  console.log('FACEBOOK_USE_AI=1');
  console.log('\n=== Test Facebook post (Vercel, after deploy + env update) ===\n');
  console.log(
    'curl -H "Authorization: Bearer $CRON_SECRET" "https://stratumielts.com/api/cron/facebook-post?variant=1"'
  );
}

main().catch((err) => {
  console.error('❌', err?.message || err);
  process.exit(1);
});
