/**
 * Facebook Page Graph API — photo posts for cross-posting from Telegram cron.
 */

const GRAPH_API = 'https://graph.facebook.com/v21.0';
const PRACTICE_LINK = '👉 Practice your IELTS Writing now: https://stratumielts.com';

/** 1×1 PNG for lightweight publish probe (no external fetch). */
const PROBE_PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
  'base64'
);

export const FACEBOOK_TOKEN_SETUP_HINT = [
  '1. developers.facebook.com/tools/explorer',
  '2. Generate USER token (not Page) with: pages_show_list, pages_read_engagement, pages_manage_posts, business_management',
  '3. Add to .env.local: FACEBOOK_USER_ACCESS_TOKEN=<user_token>',
  '4. Run: node --env-file=.env.local scripts/facebook-get-page-token.js',
  '5. Copy FACEBOOK_PAGE_ID + FACEBOOK_ACCESS_TOKEN from output, save .env.local',
].join('\n   ');

async function graphGet(path, accessToken) {
  const sep = path.includes('?') ? '&' : '?';
  const res = await fetch(`${GRAPH_API}/${path}${sep}access_token=${encodeURIComponent(accessToken)}`);
  const data = await res.json().catch(() => ({}));
  return { ok: res.ok, status: res.status, data };
}

/**
 * Resolve a Page Access Token (required for posting).
 * Tries me/accounts first when the env token is a User token.
 * @returns {Promise<{ pageId: string, accessToken: string, pageName?: string } | { error: string }>}
 */
export async function resolveFacebookPageCredentials() {
  const pageIdFromEnv = (process.env.FACEBOOK_PAGE_ID || '').trim();
  const tokenFromEnv = (process.env.FACEBOOK_ACCESS_TOKEN || '').trim();
  const userToken = (process.env.FACEBOOK_USER_ACCESS_TOKEN || '').trim();

  if (!tokenFromEnv && !userToken) {
    return { error: 'FACEBOOK_ACCESS_TOKEN is missing in .env.local' };
  }

  for (const candidate of [userToken, tokenFromEnv].filter(Boolean)) {
    const accounts = await graphGet('me/accounts?fields=id,name,access_token', candidate);
    if (accounts.ok && Array.isArray(accounts.data?.data) && accounts.data.data.length > 0) {
      const pages = accounts.data.data;
      const match =
        pages.find((p) => p.id === pageIdFromEnv) ||
        pages.find((p) => /startum/i.test(p.name || '')) ||
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
  }

  const me = await graphGet('me?fields=id,name', tokenFromEnv || userToken);
  if (!me.ok) {
    const msg = me.data?.error?.message || 'Token validation failed';
    if (/application has been deleted/i.test(msg)) {
      return {
        error:
          'Facebook app was deleted. Create a new Meta app, generate a fresh Page Access Token, and update FACEBOOK_ACCESS_TOKEN.',
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
 * Probe whether the token can publish a photo (tiny PNG upload).
 * @returns {Promise<{ ok: boolean, error?: string, postId?: string }>}
 */
export async function probeFacebookPhotoPost(pageId, accessToken) {
  const formData = new FormData();
  formData.append('source', new Blob([PROBE_PNG], { type: 'image/png' }), 'stratum-probe.png');
  formData.append('caption', 'Stratum probe — safe to delete');
  formData.append('published', 'true');
  formData.append('access_token', accessToken);

  const res = await fetch(`${GRAPH_API}/${pageId}/photos`, { method: 'POST', body: formData });
  const data = await res.json().catch(() => ({}));

  if (res.ok && data.id) {
    return { ok: true, postId: data.id };
  }

  return { ok: false, error: data?.error?.message || `HTTP ${res.status}` };
}

/**
 * Validate credentials + posting permission.
 * @returns {Promise<{ ok: true, creds: { pageId: string, accessToken: string, pageName?: string } } | { ok: false, error: string, hint?: string }>}
 */
export async function validateFacebookPageCredentials() {
  const creds = await resolveFacebookPageCredentials();
  if ('error' in creds) {
    return { ok: false, error: creds.error, hint: FACEBOOK_TOKEN_SETUP_HINT };
  }

  const probe = await probeFacebookPhotoPost(creds.pageId, creds.accessToken);
  if (probe.ok) {
    return { ok: true, creds };
  }

  const hint =
    /publish_actions|pages_manage_posts/i.test(probe.error || '')
      ? FACEBOOK_TOKEN_SETUP_HINT
      : probe.error;

  return {
    ok: false,
    error: probe.error || 'Photo post probe failed',
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

      response = await fetch(apiUrl, { method: 'POST', body: formData });
    } else {
      response = await fetch(apiUrl, {
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
