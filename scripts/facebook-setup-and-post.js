#!/usr/bin/env node
/**
 * Fix Facebook posting permissions and send a test post.
 *
 * Usage:
 *   node scripts/facebook-setup-and-post.js                    # diagnose + open Meta dashboard
 *   node scripts/facebook-setup-and-post.js <USER_TOKEN>       # exchange page token, save .env, post
 *   node scripts/facebook-setup-and-post.js --post-only      # post with current .env tokens
 */

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { createInterface } from 'readline';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const ENV_PATH = join(root, '.env.local');
const GRAPH = 'https://graph.facebook.com/v21.0';
const REQUIRED = ['pages_show_list', 'pages_read_engagement', 'pages_manage_posts'];

const PROBE_PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
  'base64'
);

function loadEnvLocal() {
  if (!existsSync(ENV_PATH)) {
    console.error('❌ .env.local not found');
    process.exit(1);
  }
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
  for (const [key, value] of Object.entries(updates)) {
    process.env[key] = value;
  }
}

async function graphGet(path, token) {
  const sep = path.includes('?') ? '&' : '?';
  const res = await fetch(`${GRAPH}/${path}${sep}access_token=${encodeURIComponent(token)}`);
  const data = await res.json().catch(() => ({}));
  return { ok: res.ok, data };
}

async function debugToken(token) {
  const res = await graphGet(`debug_token?input_token=${encodeURIComponent(token)}`, token);
  return res.data?.data || null;
}

async function getGrantedPermissions(token) {
  const res = await graphGet('me/permissions', token);
  if (!res.ok || !Array.isArray(res.data?.data)) return [];
  return res.data.data.filter((p) => p.status === 'granted').map((p) => p.permission);
}

function missingPermissions(granted) {
  return REQUIRED.filter((p) => !granted.includes(p));
}

async function resolvePage(userToken, pageIdHint) {
  const res = await graphGet('me/accounts?fields=id,name,access_token,tasks', userToken);
  if (!res.ok || !res.data?.data?.length) {
    throw new Error(res.data?.error?.message || 'me/accounts returned no pages');
  }
  const pages = res.data.data;
  return (
    pages.find((p) => p.id === pageIdHint) ||
    pages.find((p) => /startum|ielts writing/i.test(p.name || '')) ||
    pages[0]
  );
}

async function probePost(pageId, pageToken) {
  const formData = new FormData();
  formData.append('source', new Blob([PROBE_PNG], { type: 'image/png' }), 'stratum-probe.png');
  formData.append('caption', 'Stratum test post — safe to delete ✅');
  formData.append('published', 'true');
  formData.append('access_token', pageToken);

  const res = await fetch(`${GRAPH}/${pageId}/photos`, { method: 'POST', body: formData });
  const data = await res.json().catch(() => ({}));
  if (res.ok && data.id) return { ok: true, id: data.id };
  return { ok: false, error: data?.error?.message || `HTTP ${res.status}` };
}

function openUrl(url) {
  try {
    if (process.platform === 'win32') execSync(`start "" "${url}"`, { stdio: 'ignore' });
    else if (process.platform === 'darwin') execSync(`open "${url}"`, { stdio: 'ignore' });
    else execSync(`xdg-open "${url}"`, { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

function printSetupSteps(appId) {
  const appUrl = appId
    ? `https://developers.facebook.com/apps/${appId}/use_cases/`
    : 'https://developers.facebook.com/apps/';
  const explorerUrl = appId
    ? `https://developers.facebook.com/tools/explorer?method=GET&path=me%2Faccounts%3Ffields%3Did%2Cname%2Caccess_token&version=v21.0&app_id=${appId}`
    : 'https://developers.facebook.com/tools/explorer';

  console.log('\n=== Fix in Meta (one-time) ===\n');
  console.log('1. App → Use Cases → "Manage everything on your Page" → Customize');
  console.log('   Enable pages_manage_posts → status "Ready for testing"');
  console.log(`   ${appUrl}\n`);
  console.log('2. Graph API Explorer → User token (NOT Page) → add permissions:');
  console.log(`   ${REQUIRED.join(', ')}\n`);
  console.log(`   ${explorerUrl}\n`);
  console.log('3. Generate Access Token → copy User token → run:');
  console.log('   node scripts/facebook-setup-and-post.js <USER_TOKEN>\n');
}

async function askToken() {
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => {
    rl.question('\nPaste User token from Graph API Explorer (or Enter to skip): ', (answer) => {
      rl.close();
      resolve(answer.trim());
    });
  });
}

async function setupFromUserToken(userToken) {
  const info = await debugToken(userToken);
  if (!info?.is_valid) {
    throw new Error('Invalid user token');
  }

  const granted = await getGrantedPermissions(userToken);
  const missing = missingPermissions(granted);
  if (missing.length) {
    console.error(`❌ Token missing permissions: ${missing.join(', ')}`);
    printSetupSteps(info.app_id);
    process.exit(1);
  }

  const page = await resolvePage(userToken, process.env.FACEBOOK_PAGE_ID);
  if (!page?.access_token) {
    throw new Error('Could not resolve Page Access Token');
  }

  console.log(`✅ Page: ${page.name} (${page.id})`);

  updateEnvLocal({
    FACEBOOK_APP_ID: info.app_id || process.env.FACEBOOK_APP_ID || '',
    FACEBOOK_PAGE_ID: page.id,
    FACEBOOK_USER_ACCESS_TOKEN: userToken,
    FACEBOOK_ACCESS_TOKEN: page.access_token,
    FACEBOOK_USE_AI: '1',
  });

  return { pageId: page.id, pageToken: page.access_token, pageName: page.name };
}

async function postWithCurrentEnv() {
  const pageId = (process.env.FACEBOOK_PAGE_ID || '').trim();
  let pageToken = (process.env.FACEBOOK_ACCESS_TOKEN || '').trim();
  const userToken = (process.env.FACEBOOK_USER_ACCESS_TOKEN || '').trim();

  if (userToken) {
    try {
      const page = await resolvePage(userToken, pageId);
      if (page?.access_token) {
        pageToken = page.access_token;
        updateEnvLocal({ FACEBOOK_ACCESS_TOKEN: pageToken, FACEBOOK_PAGE_ID: page.id });
        console.log(`[facebook] Using fresh Page token for ${page.name}`);
      }
    } catch {
      /* fall through to env page token */
    }
  }

  const probe = await probePost(pageId, pageToken);
  if (!probe.ok) throw new Error(probe.error);
  return probe.id;
}

async function main() {
  loadEnvLocal();

  const args = process.argv.slice(2);
  const postOnly = args.includes('--post-only');
  const userTokenArg = args.find((a) => !a.startsWith('--'));

  console.log('=== Facebook setup & test post ===\n');

  const currentUser = (process.env.FACEBOOK_USER_ACCESS_TOKEN || '').trim();
  const checkToken = userTokenArg || currentUser;

  if (checkToken) {
    const info = await debugToken(checkToken);
    const granted = await getGrantedPermissions(checkToken);
    const missing = missingPermissions(granted);

    console.log(`App: ${info?.application || '?'} (${info?.app_id || '?'})`);
    console.log(`Scopes: ${(info?.scopes || granted).join(', ') || '(none)'}`);

    if (missing.length) {
      console.log(`\n❌ Missing: ${missing.join(', ')}`);
      printSetupSteps(info?.app_id);
      if (!userTokenArg) {
        openUrl(`https://developers.facebook.com/apps/${info?.app_id || ''}/use_cases/`);
        openUrl(
          `https://developers.facebook.com/tools/explorer?method=GET&path=me%2Fpermissions&version=v21.0&app_id=${info?.app_id || ''}`
        );
        const pasted = await askToken();
        if (pasted) return mainWithToken(pasted);
      }
      process.exit(1);
    }
  }

  if (userTokenArg) {
    await mainWithToken(userTokenArg);
    return;
  }

  if (postOnly || currentUser) {
    try {
      const postId = await postWithCurrentEnv();
      console.log(`\n✅ Test post published! id: ${postId}`);
      return;
    } catch (err) {
      console.error(`\n❌ Post failed: ${err.message}`);
      const info = currentUser ? await debugToken(currentUser) : null;
      printSetupSteps(info?.app_id);
      process.exit(1);
    }
  }

  printSetupSteps(process.env.FACEBOOK_APP_ID);
  const pasted = await askToken();
  if (pasted) await mainWithToken(pasted);
}

async function mainWithToken(userToken) {
  const { pageId, pageName } = await setupFromUserToken(userToken);
  console.log('✅ .env.local updated');

  const postId = await postWithCurrentEnv();
  console.log(`\n✅ Test post published to "${pageName}" (${pageId})`);
  console.log(`   Post id: ${postId}`);
  console.log('\nNext: copy FACEBOOK_* vars to Vercel → Environment Variables');
}

main().catch((err) => {
  console.error('❌', err?.message || err);
  process.exit(1);
});
