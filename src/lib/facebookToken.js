/**
 * Meta Graph API token helpers — long-lived user tokens and Page Access Tokens.
 */

const GRAPH_API = 'https://graph.facebook.com/v21.0';

async function graphGet(path, accessToken) {
  const sep = path.includes('?') ? '&' : '?';
  const res = await fetch(
    `${GRAPH_API}/${path}${sep}access_token=${encodeURIComponent(accessToken)}`
  );
  const data = await res.json().catch(() => ({}));
  return { ok: res.ok, status: res.status, data };
}

/**
 * @param {string} token
 * @returns {Promise<{ valid: boolean, expiresAt?: number, scopes?: string[], appId?: string, error?: string }>}
 */
export async function debugAccessToken(token) {
  const trimmed = String(token ?? '').trim();
  if (!trimmed) return { valid: false, error: 'Token is empty' };

  const res = await graphGet(`debug_token?input_token=${encodeURIComponent(trimmed)}`, trimmed);
  const info = res.data?.data;

  if (!res.ok || !info) {
    return { valid: false, error: res.data?.error?.message || 'debug_token failed' };
  }

  return {
    valid: Boolean(info.is_valid),
    expiresAt: info.expires_at ? info.expires_at * 1000 : undefined,
    scopes: info.scopes || [],
    appId: info.app_id,
    error: info.is_valid ? undefined : info.error?.message || 'Token invalid',
  };
}

/**
 * Exchange a short-lived User token for a ~60-day long-lived User token.
 * Requires FACEBOOK_APP_ID + FACEBOOK_APP_SECRET (Meta App → Settings → Basic).
 * @param {string} shortLivedUserToken
 * @param {string} [appId]
 * @param {string} [appSecret]
 * @returns {Promise<string>}
 */
export async function exchangeForLongLivedUserToken(shortLivedUserToken, appId, appSecret) {
  const id = (appId || process.env.FACEBOOK_APP_ID || '').trim();
  const secret = (appSecret || process.env.FACEBOOK_APP_SECRET || '').trim();
  const token = String(shortLivedUserToken ?? '').trim();

  if (!id || !secret) {
    throw new Error(
      'FACEBOOK_APP_ID and FACEBOOK_APP_SECRET are required for long-lived tokens. Add FACEBOOK_APP_SECRET from Meta App → Settings → Basic.'
    );
  }
  if (!token) throw new Error('User access token is empty');

  const params = new URLSearchParams({
    grant_type: 'fb_exchange_token',
    client_id: id,
    client_secret: secret,
    fb_exchange_token: token,
  });

  const res = await fetch(`${GRAPH_API}/oauth/access_token?${params}`);
  const data = await res.json().catch(() => ({}));

  if (!res.ok || !data.access_token) {
    throw new Error(data?.error?.message || `Long-lived exchange failed (HTTP ${res.status})`);
  }

  return data.access_token;
}

/**
 * Prefer long-lived user token when app secret is configured.
 * @param {string} [userToken]
 * @returns {Promise<string|null>}
 */
export async function resolveEffectiveUserToken(userToken) {
  const raw = String(userToken ?? process.env.FACEBOOK_USER_ACCESS_TOKEN ?? '').trim();
  if (!raw) return null;

  const appId = (process.env.FACEBOOK_APP_ID || '').trim();
  const appSecret = (process.env.FACEBOOK_APP_SECRET || '').trim();
  if (!appId || !appSecret) return raw;

  try {
    const longLived = await exchangeForLongLivedUserToken(raw, appId, appSecret);
    console.log('[facebook] Using long-lived User token (~60 days)');
    return longLived;
  } catch (err) {
    console.warn('[facebook] Long-lived exchange skipped:', err?.message || err);
    return raw;
  }
}

/**
 * @param {string} userToken
 * @param {string} [pageIdHint]
 * @returns {Promise<{ pageId: string, accessToken: string, pageName: string } | { error: string }>}
 */
export async function resolvePageTokenFromUser(userToken, pageIdHint) {
  const pageIdFromEnv = (pageIdHint || process.env.FACEBOOK_PAGE_ID || '').trim();
  const token = String(userToken ?? '').trim();
  if (!token) return { error: 'FACEBOOK_USER_ACCESS_TOKEN is missing' };

  const accounts = await graphGet('me/accounts?fields=id,name,access_token,tasks', token);
  if (accounts.ok && Array.isArray(accounts.data?.data) && accounts.data.data.length > 0) {
    const pages = accounts.data.data;
    const match =
      pages.find((p) => p.id === pageIdFromEnv) ||
      pages.find((p) => /startum|ielts writing/i.test(p.name || '')) ||
      (pages.length === 1 ? pages[0] : null);

    if (match?.access_token) {
      return { pageId: match.id, accessToken: match.access_token, pageName: match.name };
    }

    const names = pages.map((p) => `${p.name} (${p.id})`).join(', ');
    return {
      error: `FACEBOOK_PAGE_ID does not match your pages. Available: ${names}. Update FACEBOOK_PAGE_ID.`,
    };
  }

  if (pageIdFromEnv && accounts.ok) {
    const page = await graphGet(`${pageIdFromEnv}?fields=id,name,access_token`, token);
    if (page.ok && page.data?.access_token) {
      return {
        pageId: page.data.id,
        accessToken: page.data.access_token,
        pageName: page.data.name || pageIdFromEnv,
      };
    }
  }

  const msg = accounts.data?.error?.message || 'me/accounts returned no pages';
  return { error: msg };
}

/**
 * Full refresh: short-lived user token → long-lived user token → non-expiring page token.
 * @param {string} [shortLivedUserToken]
 * @returns {Promise<{ pageId: string, pageAccessToken: string, userAccessToken: string, pageName: string, userExpiresAt?: number }>}
 */
export async function refreshFacebookTokens(shortLivedUserToken) {
  const input = String(
    shortLivedUserToken ?? process.env.FACEBOOK_USER_ACCESS_TOKEN ?? ''
  ).trim();
  if (!input) throw new Error('Provide a User token from Graph API Explorer');

  const userAccessToken = await resolveEffectiveUserToken(input);
  const debug = await debugAccessToken(userAccessToken);

  const page = await resolvePageTokenFromUser(userAccessToken);
  if ('error' in page) throw new Error(page.error);

  return {
    pageId: page.pageId,
    pageAccessToken: page.accessToken,
    userAccessToken,
    pageName: page.pageName,
    userExpiresAt: debug.expiresAt,
  };
}
