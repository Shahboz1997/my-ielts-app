/**
 * Facebook Page Graph API — photo posts for cross-posting from Telegram cron.
 */

import { existsSync } from 'fs';
import { debugAccessToken, resolveEffectiveUserToken, resolvePageTokenFromUser } from './facebookToken.js';

const GRAPH_API = 'https://graph.facebook.com/v21.0';
const GRAPH_HOST = 'graph.facebook.com';
const FETCH_TIMEOUT_MS = 30_000;
const PRACTICE_LINK = '👉 Practice your IELTS Writing now: https://stratumielts.com';

export const FACEBOOK_TOKEN_SETUP_HINT = [
  '1. Meta App → Settings → Basic → copy App Secret → FACEBOOK_APP_SECRET in .env.local + Vercel',
  '2. developers.facebook.com/tools/explorer → USER token with pages_show_list, pages_read_engagement, pages_manage_posts',
  '3. Add FACEBOOK_USER_ACCESS_TOKEN=<user_token> to .env.local',
  '4. Run: node --env-file=.env.local scripts/facebook-get-page-token.js',
  '5. Copy output to .env.local AND Vercel Production env (FACEBOOK_ACCESS_TOKEN, FACEBOOK_USER_ACCESS_TOKEN)',
].join('\n   ');

/** Broken NODE_EXTRA_CA_CERTS breaks Node fetch TLS on Windows (see scripts/run-dev.js). */
export function cleanBrokenTlsEnv() {
  const ca = process.env.NODE_EXTRA_CA_CERTS;
  if (!ca?.trim()) return;
  try {
    if (!existsSync(ca)) {
      delete process.env.NODE_EXTRA_CA_CERTS;
      console.warn(
        `[facebook] NODE_EXTRA_CA_CERTS points to missing file (${ca}) — unset for Graph API calls`
      );
    }
  } catch {
    delete process.env.NODE_EXTRA_CA_CERTS;
  }
}

function formatFetchError(err, host = GRAPH_HOST) {
  const cause = err?.cause;
  const code = cause?.code || err?.code || '';
  const nested = cause?.message || '';
  const msg = err?.message || String(err);
  const blob = `${code} ${msg} ${nested}`;

  if (/UND_ERR_CONNECT_TIMEOUT|ETIMEDOUT|timeout/i.test(blob)) {
    return `Network timeout reaching ${host}. Enable VPN or check firewall/antivirus.`;
  }
  if (/fetch failed|ECONNREFUSED|ENOTFOUND|ECONNRESET/i.test(blob)) {
    return `Cannot reach ${host}${code ? ` (${code})` : ''}. Meta/Facebook may be blocked — try VPN.`;
  }
  if (/certificate|TLS|SSL|schannel|UNABLE_TO_VERIFY/i.test(blob)) {
    return `SSL/TLS error reaching ${host}. Check system date, antivirus HTTPS scanning, or VPN.`;
  }
  return msg;
}

async function graphFetch(url, init = {}) {
  cleanBrokenTlsEnv();
  try {
    return await fetch(url, {
      ...init,
      signal: init.signal ?? AbortSignal.timeout(FETCH_TIMEOUT_MS),
    });
  } catch (err) {
    throw new Error(formatFetchError(err), { cause: err });
  }
}

async function graphGet(path, accessToken) {
  try {
    const sep = path.includes('?') ? '&' : '?';
    const res = await graphFetch(
      `${GRAPH_API}/${path}${sep}access_token=${encodeURIComponent(accessToken)}`
    );
    const data = await res.json().catch(() => ({}));
    return { ok: res.ok, status: res.status, data };
  } catch (err) {
    return { ok: false, status: 0, data: { error: { message: err.message } } };
  }
}

/**
 * Resolve a Page Access Token (required for posting).
 * Tries me/accounts first when the env token is a User token.
 * @returns {Promise<{ pageId: string, accessToken: string, pageName?: string } | { error: string }>}
 */
export async function resolveFacebookPageCredentials() {
  const pageIdFromEnv = (process.env.FACEBOOK_PAGE_ID || '').trim();
  const tokenFromEnv = (process.env.FACEBOOK_ACCESS_TOKEN || '').trim();
  const userTokenRaw = (process.env.FACEBOOK_USER_ACCESS_TOKEN || '').trim();

  if (!tokenFromEnv && !userTokenRaw) {
    return { error: 'FACEBOOK_ACCESS_TOKEN is missing in .env.local' };
  }

  if (pageIdFromEnv.length > 17) {
    return {
      error: `FACEBOOK_PAGE_ID looks invalid (${pageIdFromEnv.length} digits). Meta page ids are 15–16 digits — run scripts/facebook-get-page-token.js.`,
    };
  }

  // Fresh page token from User token (long-lived when FACEBOOK_APP_SECRET is set).
  if (userTokenRaw) {
    const userToken = await resolveEffectiveUserToken(userTokenRaw);
    const fromUser = await resolvePageTokenFromUser(userToken, pageIdFromEnv);
    if (!('error' in fromUser)) {
      console.log('[facebook] Page token from User token →', fromUser.pageName, `(${fromUser.pageId})`);
      return {
        pageId: fromUser.pageId,
        accessToken: fromUser.accessToken,
        pageName: fromUser.pageName,
      };
    }

    const userMsg = fromUser.error || '';
    if (/Network timeout|Cannot reach|SSL\/TLS error/i.test(userMsg)) {
      return { error: userMsg };
    }
    if (!tokenFromEnv) {
      return { error: userMsg };
    }
    console.warn('[facebook] User token refresh failed, trying env page token:', userMsg);
  }

  // Fallback: env page token (non-expiring when issued from a long-lived User token).
  if (pageIdFromEnv && tokenFromEnv) {
    const page = await graphGet(`${pageIdFromEnv}?fields=id,name`, tokenFromEnv);
    if (page.ok && page.data?.id) {
      console.log('[facebook] Token scoped to page', page.data.name, `(${page.data.id})`);
      return { pageId: page.data.id, accessToken: tokenFromEnv, pageName: page.data.name };
    }

    const pageMsg = page.data?.error?.message || '';
    if (/Network timeout|Cannot reach|SSL\/TLS error/i.test(pageMsg)) {
      return { error: pageMsg };
    }
  }

  for (const candidate of [userTokenRaw, tokenFromEnv].filter(Boolean)) {
    const accounts = await graphGet('me/accounts?fields=id,name,access_token', candidate);
    if (accounts.ok && Array.isArray(accounts.data?.data) && accounts.data.data.length > 0) {
      const pages = accounts.data.data;
      const match =
        pages.find((p) => p.id === pageIdFromEnv) ||
        pages.find((p) => /startum|ielts writing/i.test(p.name || '')) ||
        (pages.length === 1 ? pages[0] : null);

      if (match?.access_token) {
        console.log('[facebook] Using Page Access Token for', match.name, `(${match.id})`);
        return { pageId: match.id, accessToken: match.access_token, pageName: match.name };
      }

      const names = pages.map((p) => `${p.name} (${p.id})`).join(', ');
      return {
        error: `FACEBOOK_PAGE_ID does not match your pages. Available: ${names}. Update FACEBOOK_PAGE_ID in .env.local.`,
      };
    }

    if (pageIdFromEnv && accounts.ok) {
      const page = await graphGet(`${pageIdFromEnv}?fields=id,name,access_token`, candidate);
      if (page.ok && page.data?.access_token) {
        console.log('[facebook] Page token via', pageIdFromEnv, '→', page.data.name);
        return { pageId: page.data.id, accessToken: page.data.access_token, pageName: page.data.name };
      }
    }
  }

  const me = await graphGet('me?fields=id,name', tokenFromEnv || userTokenRaw);
  if (!me.ok) {
    const msg = me.data?.error?.message || 'Token validation failed';
    if (/application has been deleted/i.test(msg)) {
      return {
        error:
          'Facebook app was deleted. Create a new Meta app, generate a fresh Page Access Token, and update FACEBOOK_ACCESS_TOKEN.',
      };
    }
    if (me.data?.error?.code === 2500 && !pageIdFromEnv) {
      return {
        error:
          'Token is Page-scoped but FACEBOOK_PAGE_ID is missing. Set FACEBOOK_PAGE_ID in .env.local or use FACEBOOK_USER_ACCESS_TOKEN + scripts/facebook-get-page-token.js.',
      };
    }
    return { error: msg };
  }

  const pageId = pageIdFromEnv || me.data?.id;
  if (!pageId) {
    return { error: 'Could not determine FACEBOOK_PAGE_ID. Set it in .env.local.' };
  }

  if (pageIdFromEnv && me.data?.id && pageIdFromEnv !== me.data.id) {
    return {
      error: `FACEBOOK_PAGE_ID mismatch: env=${pageIdFromEnv}, token is for page ${me.data.id} (${me.data.name}). Fix .env.local.`,
    };
  }

  console.log('[facebook] Token scoped to page', me.data?.name, `(${pageId})`);
  console.warn(
    '[facebook] Warning: token was not resolved via me/accounts — posting may fail. ' +
      'Use FACEBOOK_USER_ACCESS_TOKEN + scripts/facebook-get-page-token.js'
  );
  return { pageId, accessToken: tokenFromEnv, pageName: me.data?.name };
}

/**
 * Validate token via debug_token (no junk posts on the Page).
 * @returns {Promise<{ ok: boolean, error?: string }>}
 */
export async function validateFacebookTokenForPosting(pageId, accessToken) {
  const debug = await debugAccessToken(accessToken);
  if (!debug.valid) {
    return { ok: false, error: debug.error || 'Token invalid' };
  }

  const scopes = debug.scopes || [];
  if (!scopes.includes('pages_manage_posts')) {
    return {
      ok: false,
      error: 'Token missing pages_manage_posts permission — regenerate User token in Graph API Explorer.',
    };
  }

  const page = await graphGet(`${pageId}?fields=id,name`, accessToken);
  if (!page.ok || !page.data?.id) {
    return { ok: false, error: page.data?.error?.message || 'Cannot access Page with this token' };
  }

  return { ok: true };
}

/**
 * Validate credentials + posting permission.
 * @returns {Promise<{ ok: true, creds: { pageId: string, accessToken: string, pageName?: string } } | { ok: false, error: string, hint?: string }>}
 */
export async function validateFacebookPageCredentials() {
  const creds = await resolveFacebookPageCredentials();
  if ('error' in creds) {
    const hint = /Network timeout|Cannot reach|SSL\/TLS error/i.test(creds.error)
      ? 'Enable VPN — graph.facebook.com is unreachable from this network. Production cron on Vercel still works.'
      : FACEBOOK_TOKEN_SETUP_HINT;
    return { ok: false, error: creds.error, hint };
  }

  const tokenCheck = await validateFacebookTokenForPosting(creds.pageId, creds.accessToken);
  if (tokenCheck.ok) {
    return { ok: true, creds };
  }

  const hint =
    /Network timeout|Cannot reach|SSL\/TLS error/i.test(tokenCheck.error || '')
      ? 'Enable VPN — graph.facebook.com is unreachable from this network. Production cron on Vercel still works.'
      : /expired|Session has expired/i.test(tokenCheck.error || '')
        ? [
            'Token expired. Graph API Explorer → fresh USER token →',
            'node --env-file=.env.local scripts/facebook-get-page-token.js →',
            'update .env.local + Vercel Production env vars.',
          ].join(' ')
        : /pages_manage_posts/i.test(tokenCheck.error || '')
          ? [
              'Token is missing pages_manage_posts permission.',
              'Graph API Explorer → add pages_manage_posts → generate User token →',
              'node --env-file=.env.local scripts/facebook-get-page-token.js',
            ].join(' ')
          : FACEBOOK_TOKEN_SETUP_HINT;

  return {
    ok: false,
    error: tokenCheck.error || 'Token validation failed',
    hint,
  };
}

/**
 * Strip Telegram HTML and bot commands; adapt copy for Facebook.
 * @param {string} telegramText
 * @returns {string}
 */
export function adaptTelegramTextForFacebook(telegramText) {
  let text = String(telegramText ?? '');

  text = text.replace(/<tg-spoiler>[\s\S]*?<\/tg-spoiler>/gi, '');
  text = text.replace(/<a[^>]*href="([^"]*)"[^>]*>([\s\S]*?)<\/a>/gi, '$2 ($1)');
  text = text.replace(/<code>([\s\S]*?)<\/code>/gi, '$1');
  text = text.replace(/<\/?(?:b|i|u|s)>/gi, '');
  text = text.replace(/<[^>]+>/g, '');
  text = text
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"');

  text = text.replace(/^\s*\/?check\b[^\n]*/gim, '');
  text = text.replace(/@\w+_bot\b/gi, '');
  text = text.replace(/\n{3,}/g, '\n\n').trim();

  if (!/stratumielts\.com/i.test(text)) {
    text = `${text}\n\n${PRACTICE_LINK}`;
  } else {
    text = text.replace(
      /https?:\/\/(?:www\.)?stratumielts\.com[^\s]*/gi,
      'https://stratumielts.com'
    );
    if (!text.includes(PRACTICE_LINK)) {
      text = `${text}\n\n${PRACTICE_LINK}`;
    }
  }

  return text.trim();
}

function facebookErrorHint(data) {
  const msg = data?.error?.message || '';
  const code = data?.error?.code;

  if (code === 190 || /application has been deleted/i.test(msg)) {
    return 'Create a new app at developers.facebook.com and generate a new Page Access Token.';
  }
  if (/publish_actions|pages_manage_posts/i.test(msg)) {
    return [
      'Current token cannot publish photos.',
      'Step 1: Graph API Explorer → generate a USER token (not Page) with pages_show_list, pages_read_engagement, pages_manage_posts.',
      'Step 2: Run GET me/accounts — copy access_token for Startum Ai into FACEBOOK_ACCESS_TOKEN.',
      'Or set FACEBOOK_USER_ACCESS_TOKEN and run: node --env-file=.env.local scripts/facebook-get-page-token.js',
    ].join(' ');
  }
  if (/does not exist/i.test(msg)) {
    return 'FACEBOOK_PAGE_ID is wrong. Run: node --env-file=.env.local scripts/facebook-verify-token.js';
  }
  return null;
}

/** Short actionable hint for Telegram admin alerts. */
export function getFacebookErrorAlertHint(error) {
  const msg = String(error ?? '');
  if (/expired|session has expired/i.test(msg)) {
    return 'FACEBOOK_ACCESS_TOKEN expired — run scripts/facebook-get-page-token.js and update Vercel env vars.';
  }
  if (/application has been deleted/i.test(msg)) {
    return 'Meta app was deleted — create a new app and fresh Page Access Token.';
  }
  if (/pages_manage_posts|publish/i.test(msg)) {
    return 'Token lacks pages_manage_posts — regenerate Page token via facebook-get-page-token.js.';
  }
  if (/FACEBOOK_PAGE_ID|does not exist/i.test(msg)) {
    return 'FACEBOOK_PAGE_ID mismatch — run scripts/facebook-verify-token.js.';
  }
  if (/Network timeout|Cannot reach|SSL\/TLS error|VPN/i.test(msg)) {
    return 'Local network cannot reach graph.facebook.com — enable VPN, then retry scripts/facebook-send-test.js.';
  }
  return 'Verify locally: node --env-file=.env.local scripts/facebook-verify-token.js';
}

/**
 * Publish a photo to the Facebook Page by public URL or binary buffer.
 * @param {string | Buffer | { url?: string, buffer?: Buffer }} image
 * @param {string} caption
 * @returns {Promise<{ success: boolean, id?: string, error?: unknown }>}
 */
export async function postImageToFacebookPage(image, caption) {
  const creds = await resolveFacebookPageCredentials();
  if ('error' in creds) {
    console.error('[facebook]', creds.error);
    return { success: false, error: creds.error };
  }

  const { pageId, accessToken } = creds;

  let imageUrl;
  let imageBuffer;

  if (Buffer.isBuffer(image)) {
    imageBuffer = image;
  } else if (image && typeof image === 'object' && (image.url || image.buffer)) {
    imageUrl = image.url;
    imageBuffer = image.buffer;
  } else {
    imageUrl = String(image ?? '').trim();
  }

  if (!imageUrl && !imageBuffer?.length) {
    console.error('[facebook] image URL or buffer is required');
    return { success: false, error: 'Missing image' };
  }

  const apiUrl = `${GRAPH_API}/${pageId}/photos`;

  try {
    console.log('[facebook] Posting photo to page', pageId);

    let response;

    if (imageBuffer?.length) {
      const formData = new FormData();
      formData.append('source', new Blob([imageBuffer], { type: 'image/png' }), 'stratum-banner.png');
      formData.append('caption', String(caption ?? '').trim());
      formData.append('published', 'true');
      formData.append('access_token', accessToken);

      response = await graphFetch(apiUrl, { method: 'POST', body: formData });
    } else {
      response = await graphFetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: imageUrl,
          caption: String(caption ?? '').trim(),
          published: true,
          access_token: accessToken,
        }),
      });
    }

    const data = await response.json().catch(() => ({}));

    if (response.ok && data.id) {
      console.log('[facebook] Post published, id:', data.id);
      return { success: true, id: data.id };
    }

    console.error('[facebook] Meta API error:', JSON.stringify(data, null, 2));
    const hint = facebookErrorHint(data);
    if (hint) console.error('[facebook] Hint:', hint);

    return { success: false, error: data?.error?.message || data };
  } catch (error) {
    console.error('[facebook] Network error:', error?.message || error);
    return { success: false, error: error?.message || String(error) };
  }
}
