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

function explorerUrl(appId) {
  const id = (appId || '').trim();
  return id
    ? `https://developers.facebook.com/tools/explorer?method=GET&path=me%2Faccounts%3Ffields%3Did%2Cname%2Caccess_token&version=v21.0&app_id=${id}`
    : 'https://developers.facebook.com/tools/explorer';
}

function printTokenHelp(appId, reason) {
  if (reason) console.error(`\n❌ ${reason}\n`);
  console.log('=== Get a fresh User token (NOT Page token) ===\n');
  console.log('1. Open Graph API Explorer:');
  console.log(`   ${explorerUrl(appId)}\n`);
  console.log('2. Meta app → select your app (must match FACEBOOK_APP_ID in .env.local)');
  console.log('3. Token type: **User token** (not Page token)');
  console.log(`4. Add permissions: ${REQUIRED.join(', ')}`);
  console.log('5. Generate Access Token → copy → run:');
  console.log('   node --env-file=.env.local scripts/facebook-get-page-token.js <USER_TOKEN>\n');
}

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

  const appId = (process.env.FACEBOOK_APP_ID || '').trim();
  const pageId = (process.env.FACEBOOK_PAGE_ID || '').trim();
  const userTokenArg = (process.argv[2] || process.env.FACEBOOK_USER_ACCESS_TOKEN || '').trim();

  if (!userTokenArg) {
    const envPageToken = (process.env.FACEBOOK_ACCESS_TOKEN || '').trim();
    if (envPageToken) {
      const dbg = await debugAccessToken(envPageToken);
      if (/deleted/i.test(dbg.error || '')) {
        printTokenHelp(
          appId,
          'FACEBOOK_ACCESS_TOKEN belongs to a deleted Meta app. You changed FACEBOOK_APP_ID but did not regenerate tokens.'
        );
        process.exit(1);
      }
    }
    printTokenHelp(appId, 'FACEBOOK_USER_ACCESS_TOKEN is missing. Pass a User token as argument.');
    process.exit(1);
  }

  const tokenDebug = await debugAccessToken(userTokenArg);
  if (!tokenDebug.valid) {
    printTokenHelp(
      appId,
      tokenDebug.error || 'Token is invalid'
    );
    process.exit(1);
  }

  if (appId && tokenDebug.appId && tokenDebug.appId !== appId) {
    console.warn(
      `⚠️  Token app_id (${tokenDebug.appId}) ≠ FACEBOOK_APP_ID (${appId}) — update .env.local or regenerate token for the correct app.\n`
    );
  }

  const me = await fetch(
    `https://graph.facebook.com/v21.0/me?fields=id,name&access_token=${encodeURIComponent(userTokenArg)}`
  ).then((r) => r.json());
  if (me?.id && pageId && me.id === pageId) {
    printTokenHelp(
      appId,
      'You pasted a Page token. Graph API Explorer must use a User token to list pages and get a Page Access Token.'
    );
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
    printTokenHelp(
      appId,
      `Token missing permissions: ${missing.join(', ')}`
    );
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
