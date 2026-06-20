#!/usr/bin/env node
/**
 * Deep Facebook setup diagnostic (tokens, page id, permissions, prod cron).
 * Usage: node --env-file=.env.local scripts/facebook-diagnose.js
 */

import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const GRAPH = 'https://graph.facebook.com/v21.0';

function loadEnvLocal() {
  const path = join(root, '.env.local');
  if (!existsSync(path)) {
    console.error('❌ .env.local not found');
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

async function graph(path, token) {
  const sep = path.includes('?') ? '&' : '?';
  const res = await fetch(`${GRAPH}/${path}${sep}access_token=${encodeURIComponent(token)}`);
  const data = await res.json().catch(() => ({}));
  return { ok: res.ok, status: res.status, data };
}

function mask(token) {
  const t = String(token || '');
  if (t.length < 16) return '(empty or too short)';
  return `${t.slice(0, 8)}…${t.slice(-6)} (${t.length} chars)`;
}

async function main() {
  loadEnvLocal();

  const pageId = (process.env.FACEBOOK_PAGE_ID || '').trim();
  const pageToken = (process.env.FACEBOOK_ACCESS_TOKEN || '').trim();
  const userToken = (process.env.FACEBOOK_USER_ACCESS_TOKEN || '').trim();
  const useAi = process.env.FACEBOOK_USE_AI;
  const cronSecret = (process.env.CRON_SECRET || '').trim();

  console.log('=== Facebook deep diagnostic ===\n');

  console.log('📁 .env.local');
  console.log(`   FACEBOOK_PAGE_ID          = ${pageId || '(missing)'}`);
  console.log(`   FACEBOOK_ACCESS_TOKEN     = ${mask(pageToken)}`);
  console.log(`   FACEBOOK_USER_ACCESS_TOKEN= ${userToken ? mask(userToken) : '(not set — recommended)'}`);
  console.log(`   FACEBOOK_USE_AI           = ${useAi ?? '(missing)'}`);
  console.log(`   CRON_SECRET               = ${cronSecret ? 'set' : '(missing)'}`);

  if (pageId.length > 17) {
    console.log('\n⚠️  FACEBOOK_PAGE_ID looks too long — Meta page ids are usually 15–16 digits.');
  }

  if (!pageToken && !userToken) {
    console.error('\n❌ No Facebook tokens configured.');
    process.exit(1);
  }

  for (const [label, token] of [
    ['FACEBOOK_ACCESS_TOKEN', pageToken],
    ['FACEBOOK_USER_ACCESS_TOKEN', userToken],
  ]) {
    if (!token) continue;
    console.log(`\n--- ${label} ---`);

    const me = await graph('me?fields=id,name', token);
    if (me.ok) {
      console.log(`✅ me: ${me.data.name} (${me.data.id})`);
    } else {
      console.log(`❌ me: ${me.data?.error?.message || me.status}`);
      if (me.data?.error?.code) console.log(`   code: ${me.data.error.code}`);
    }

    const accounts = await graph('me/accounts?fields=id,name,access_token,tasks', token);
    if (accounts.ok && accounts.data?.data?.length) {
      console.log(`✅ me/accounts: ${accounts.data.data.length} page(s)`);
      for (const p of accounts.data.data) {
        const tasks = (p.tasks || []).join(', ') || 'unknown';
        const match = p.id === pageId ? ' ← env PAGE_ID match' : '';
        console.log(`   • ${p.name} (${p.id}) tasks=[${tasks}]${match}`);
      }
    } else if (accounts.ok) {
      console.log('⚠️  me/accounts: empty (token may be Page-scoped, not User)');
    } else {
      console.log(`ℹ️  me/accounts: ${accounts.data?.error?.message || 'n/a'}`);
    }

    const perms = await graph('me/permissions', token);
    if (perms.ok && Array.isArray(perms.data?.data)) {
      const granted = perms.data.data.filter((p) => p.status === 'granted').map((p) => p.permission);
      const needed = ['pages_manage_posts', 'pages_read_engagement', 'pages_show_list'];
      const missing = needed.filter((n) => !granted.includes(n));
      console.log(`   permissions granted: ${granted.filter((p) => p.startsWith('pages_')).join(', ') || '(none pages_*)'}`);
      if (missing.length) console.log(`   ⚠️  missing for posting: ${missing.join(', ')}`);
    }
  }

  if (pageId && pageToken) {
    console.log('\n--- Page token direct test ---');
    const pageMe = await graph(`${pageId}?fields=id,name`, pageToken);
    if (pageMe.ok) {
      console.log(`✅ Page reachable: ${pageMe.data.name} (${pageMe.data.id})`);
    } else {
      console.log(`❌ Page lookup: ${pageMe.data?.error?.message || pageMe.status}`);
    }
  }

  if (cronSecret) {
    console.log('\n--- Production cron (stratumielts.com) ---');
    try {
      const res = await fetch(
        'https://stratumielts.com/api/cron/telegram-daily?slot=morning',
        { headers: { Authorization: `Bearer ${cronSecret}` } }
      );
      const body = await res.json().catch(() => ({}));
      console.log(`   HTTP ${res.status}`);
      if (body.facebookPostId) console.log(`   ✅ facebookPostId: ${body.facebookPostId}`);
      else if (body.facebookError) console.log(`   ❌ facebookError: ${body.facebookError}`);
      else if (body.ok && !body.facebookPostId && useAi !== '1') {
        console.log('   ⚠️  FACEBOOK_USE_AI is not 1 on production — cross-post disabled');
      } else if (body.ok && !body.facebookPostId && !body.facebookError) {
        console.log('   ⚠️  Telegram ok but no facebook fields — check FACEBOOK_USE_AI on Vercel');
      }
      if (body.messageId) console.log(`   Telegram messageId: ${body.messageId}`);
    } catch (e) {
      console.log(`   ❌ fetch failed: ${e.message}`);
    }
  }

  console.log('\n=== Recommended fix ===');
  console.log('1. Graph API Explorer → User token + pages_manage_posts');
  console.log('2. FACEBOOK_USER_ACCESS_TOKEN=... in .env.local (uncommented)');
  console.log('3. node --env-file=.env.local scripts/facebook-get-page-token.js');
  console.log('4. Copy FACEBOOK_PAGE_ID + FACEBOOK_ACCESS_TOKEN to .env.local AND Vercel');
  console.log('5. node --env-file=.env.local scripts/facebook-verify-token.js');
}

main().catch((e) => {
  console.error(e?.message || e);
  process.exit(1);
});
