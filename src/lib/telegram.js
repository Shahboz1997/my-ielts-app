/**
 * Telegram Bot API helpers (daily group posts + command webhook).
 */
import { TELEGRAM_BOT_USERNAME } from '@/lib/support';

function getBotToken() {
  return (process.env.TELEGRAM_BOT_TOKEN || '').trim();
}

export function isTelegramConfigured() {
  return Boolean(getBotToken());
}

/** Group or channel chat id (TELEGRAM_GROUP_ID takes precedence). */
export function getTelegramGroupId() {
  return (
    (process.env.TELEGRAM_GROUP_ID || '').trim() ||
    (process.env.TELEGRAM_CHANNEL_ID || '').trim()
  );
}

export function getTelegramChannelId() {
  return getTelegramGroupId();
}

/** Private chat id for ops alerts (your Telegram user id after /start with the bot). */
export function getTelegramAlertChatId() {
  return (process.env.TELEGRAM_ALERT_CHAT_ID || process.env.TELEGRAM_ADMIN_CHAT_ID || '').trim();
}

/**
 * DM admin when Facebook cross-post fails (non-blocking for cron).
 * Set TELEGRAM_ALERT_CHAT_ID in Vercel + .env.local.
 */
export async function notifyFacebookCrossPostFailure({ slot, error, hint }) {
  const chatId = getTelegramAlertChatId();
  if (!chatId) {
    console.warn('[telegram] Facebook alert skipped — set TELEGRAM_ALERT_CHAT_ID');
    return { ok: false, skipped: true };
  }

  const errText = escapeHtml(String(error ?? 'unknown error').slice(0, 600));
  const hintText = hint ? escapeHtml(String(hint).slice(0, 400)) : '';

  const lines = [
    '⚠️ <b>Facebook cross-post failed</b>',
    '',
    `Slot: <code>${escapeHtml(slot || 'unknown')}</code>`,
    `Time: <code>${escapeHtml(new Date().toISOString())}</code>`,
    '',
    `<b>Error</b>\n${errText}`,
  ];
  if (hintText) {
    lines.push('', `<b>Fix</b>\n${hintText}`);
  }

  const result = await sendTelegramMessage(chatId, lines.join('\n'), { disable_notification: false });
  if (!result.ok) {
    console.warn('[telegram] Facebook alert send failed', result.error);
  }
  return result;
}

function escapeHtml(text) {
  return String(text ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

export { escapeHtml };

export const STRATUM_SITE_URL = 'https://stratumielts.com/';
export const STRATUM_SITE_LINK_HTML = `<a href="${STRATUM_SITE_URL}">${STRATUM_SITE_URL}</a>`;

/** Append stratumielts.com link if not already present (after prepareTelegramHtml). */
export function appendStratumSiteLink(text) {
  const t = String(text ?? '').trim();
  if (t.includes('stratumielts.com')) return t;
  return `${t}\n${STRATUM_SITE_LINK_HTML}`;
}

/** Canonical bot @handle — used in channel inline buttons (not getMe, so links stay correct after bot migration). */
export function getTelegramBotUsername() {
  const fromEnv = (process.env.TELEGRAM_BOT_USERNAME || '').trim();
  return fromEnv || TELEGRAM_BOT_USERNAME;
}

export function getTelegramBotCheckUrl() {
  return `https://t.me/${getTelegramBotUsername()}?start=check`;
}

/** Inline CTA button — clicks ~30–40% more than plain links. */
export function buildCtaInlineKeyboard(url, label = '👉 stratumielts.com — Check your writing') {
  return {
    inline_keyboard: [[{ text: label, url: String(url) }]],
  };
}

/** Morning: site CTA. Evening: site + DM essay check. */
export function buildPostInlineKeyboard({ ctaUrl, ctaLabel, botUsername, includeCheckButton = false }) {
  const row1 = [{ text: ctaLabel, url: String(ctaUrl) }];
  const user = (botUsername || getTelegramBotUsername()).trim();
  if (includeCheckButton && user) {
    return {
      inline_keyboard: [
        row1,
        [{ text: '✅ Check my text', url: `https://t.me/${user}?start=check` }],
      ],
    };
  }
  return { inline_keyboard: [row1] };
}

/** Seconds from now for scheduled poll (Telegram schedule_date). */
export const MORNING_QUIZ_DELAY_SEC = Number(process.env.TELEGRAM_MORNING_QUIZ_DELAY_SEC || 300);

/** Strip raw URLs and unsafe tags from AI output; keep b/i/code. Enforce English-only copy. */
export function prepareTelegramHtml(text) {
  let t = String(text ?? '').trim();
  t = t.replace(/https?:\/\/\S+/gi, '').trim();
  t = t.replace(/\n*(?:👉|🔗|✍️|→)\s*[^\n]*$/u, '').trim();
  t = t.replace(/<tg-spoiler>[\s\S]*?<\/tg-spoiler>/gi, '');
  t = t
    .split('\n')
    .filter((line) => !/[\u0400-\u04FF]/.test(line))
    .join('\n');
  t = t.replace(/<(?!\/?(?:b|i|code|strong|em|span)\b)[^>]+>/gi, '');
  t = t.replace(/<\/?(strong|em)>/gi, (m) =>
    m.includes('strong') ? (m.startsWith('</') ? '</b>' : '<b>') : m.startsWith('</') ? '</i>' : '<i>'
  );
  return t.replace(/\n{3,}/g, '\n\n').trim();
}

async function callTelegramApi(method, body) {
  const token = getBotToken();
  if (!token) {
    return { ok: false, error: 'TELEGRAM_BOT_TOKEN is not configured' };
  }

  const res = await fetch(`https://api.telegram.org/bot${token}/${method}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok || data.ok === false) {
    console.warn('[telegram]', method, data.description || res.status);
    return { ok: false, error: data.description || `HTTP ${res.status}`, data };
  }
  return { ok: true, data };
}

/** @param {string} chatId */
export async function sendTelegramMessage(chatId, text, options = {}) {
  const body = {
    chat_id: chatId,
    text,
    disable_web_page_preview: false,
    ...options,
  };
  if (!('parse_mode' in options)) {
    body.parse_mode = 'HTML';
  }
  return callTelegramApi('sendMessage', body);
}

/** Send multiple HTML messages in order (e.g. deep essay feedback). */
export async function sendTelegramMessageParts(chatId, parts, options = {}) {
  const { delayMs = 400, ...lastOptions } = options;
  const messages = (Array.isArray(parts) ? parts : []).filter((p) => String(p || '').trim());
  if (!messages.length) return { ok: false, error: 'empty' };

  let last = { ok: false };
  for (let i = 0; i < messages.length; i++) {
    const isLast = i === messages.length - 1;
    last = await sendTelegramMessage(
      chatId,
      messages[i],
      isLast ? lastOptions : { parse_mode: 'HTML' }
    );
    if (!last.ok) return last;
    if (!isLast && delayMs > 0) {
      await new Promise((r) => setTimeout(r, delayMs));
    }
  }
  return last;
}

export async function sendToChannel(text, options = {}) {
  return sendToGroup(text, options);
}

export async function sendToGroup(text, options = {}) {
  const chatId = getTelegramGroupId();
  if (!chatId) {
    return {
      ok: false,
      error: 'TELEGRAM_GROUP_ID (or TELEGRAM_CHANNEL_ID) is not configured',
    };
  }
  return sendTelegramMessage(chatId, text, options);
}

/**
 * Native Telegram quiz poll (evening posts).
 * @param {string} chatId
 * @param {{ question: string, options: string[], correctOptionId: number, explanation?: string }} poll
 */
export async function sendTelegramQuizPoll(chatId, poll, options = {}) {
  const body = {
    chat_id: chatId,
    question: String(poll.question).slice(0, 300),
    options: poll.options.map((o) => String(o).slice(0, 100)),
    type: 'quiz',
    correct_option_id: poll.correctOptionId,
    is_anonymous: true,
  };
  if (poll.explanation) {
    body.explanation = String(poll.explanation).slice(0, 200);
  }
  if (options.scheduleDate) {
    body.schedule_date = Math.floor(options.scheduleDate.getTime() / 1000);
  }
  return callTelegramApi('sendPoll', body);
}

export async function sendQuizPollToGroup(poll, options = {}) {
  const chatId = getTelegramGroupId();
  if (!chatId) {
    return { ok: false, error: 'TELEGRAM_GROUP_ID (or TELEGRAM_CHANNEL_ID) is not configured' };
  }
  return sendTelegramQuizPoll(chatId, poll, options);
}

export async function getTelegramBotInfo() {
  const token = getBotToken();
  if (!token) return { ok: false, error: 'TELEGRAM_BOT_TOKEN is not configured' };
  const res = await fetch(`https://api.telegram.org/bot${token}/getMe`);
  const data = await res.json().catch(() => ({}));
  return data.ok ? { ok: true, bot: data.result } : { ok: false, error: data.description };
}

export async function setTelegramWebhook(webhookUrl, secretToken) {
  const body = { url: webhookUrl, allowed_updates: ['message'] };
  if (secretToken) body.secret_token = secretToken;
  return callTelegramApi('setWebhook', body);
}
