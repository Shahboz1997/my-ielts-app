#!/usr/bin/env node
/**
 * Exchange a User Access Token for a Page Access Token via GET me/accounts.
 *
 * 1. Graph API Explorer → User token + pages_show_list, pages_manage_posts, pages_read_engagement
 * 2. Add to .env.local: FACEBOOK_USER_ACCESS_TOKEN=...
 * 3. node --env-file=.env.local scripts/facebook-get-page-token.js
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
    process.env[trimmed.slice(0, eq).trim()] = trimmed.slice(eq + 1).trim();
  }
}

async function main() {
  loadEnvLocal();
  const userToken = (process.env.FACEBOOK_USER_ACCESS_TOKEN || process.argv[2] || '').trim();
  if (!userToken) {
    console.error('Set FACEBOOK_USER_ACCESS_TOKEN in .env.local or pass as argument.');
    process.exit(1);
  }

  const res = await fetch(
    `https://graph.facebook.com/v21.0/me/accounts?fields=id,name,access_token,tasks&access_token=${encodeURIComponent(userToken)}`
  );
  const data = await res.json();

  if (!res.ok || !data.data?.length) {
    console.error('❌ me/accounts returned no pages:', JSON.stringify(data, null, 2));
    console.log('\nGenerate a USER token (not Page) with permissions:');
    console.log('  pages_show_list, pages_read_engagement, pages_manage_posts, business_management');
    console.log('\nIn Graph API Explorer: do NOT select Page in dropdown — use User token, then run this script.');
    process.exit(1);
  }

  console.log('=== Pages available ===\n');
  for (const page of data.data) {
    console.log(`📄 ${page.name}`);
    console.log(`   FACEBOOK_PAGE_ID=${page.id}`);
    console.log(`   FACEBOOK_ACCESS_TOKEN=${page.access_token?.slice(0, 20)}…`);
    console.log('');
  }

  const preferred =
    data.data.find((p) => /startum/i.test(p.name || '')) ||
    data.data.find((p) => p.id === process.env.FACEBOOK_PAGE_ID) ||
    data.data[0];

  console.log('=== Copy into .env.local ===\n');
  console.log(`FACEBOOK_PAGE_ID=${preferred.id}`);
  console.log(`FACEBOOK_ACCESS_TOKEN=${preferred.access_token}`);
  console.log('FACEBOOK_USE_AI=1');
}

main().catch((err) => {
  console.error(err?.message || err);
  process.exit(1);
});
