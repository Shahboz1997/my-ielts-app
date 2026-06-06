/**
 * Telegram Bot API helpers (daily group posts + command webhook).
 */

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

function escapeHtml(text) {
  return String(text ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

export { escapeHtml };

/** Inline CTA button — clicks ~30–40% more than plain links. */
export function buildCtaInlineKeyboard(url, label = '👉 stratumielts.com — Check your writing') {
  return {
    inline_keyboard: [[{ text: label, url: String(url) }]],
  };
}

/** Morning: site CTA. Evening: site + DM essay check. */
export function buildPostInlineKeyboard({ ctaUrl, ctaLabel, botUsername, includeCheckButton = false }) {
  const row1 = [{ text: ctaLabel, url: String(ctaUrl) }];
  if (includeCheckButton && botUsername) {
    return {
      inline_keyboard: [
        row1,
        [{ text: '✅ Check my text', url: `https://t.me/${botUsername}?start=check` }],
      ],
    };
  }
  return { inline_keyboard: [row1] };
}

/** Seconds from now for scheduled poll (Telegram schedule_date). */
export const MORNING_QUIZ_DELAY_SEC = Number(process.env.TELEGRAM_MORNING_QUIZ_DELAY_SEC || 300);

/** Strip raw URLs and unsafe tags from AI output; keep b/i/code. */
export function prepareTelegramHtml(text) {
  let t = String(text ?? '').trim();
  t = t.replace(/https?:\/\/\S+/gi, '').trim();
  t = t.replace(/\n*(?:👉|🔗|✍️|→)\s*[^\n]*$/u, '').trim();
  t = t.replace(/<(?!\/?(?:b|i|code|strong|em|tg-spoiler|span)\b)[^>]+>/gi, '');
  t = t.replace(/<\/?(strong|em)>/gi, (m) =>
    m.includes('strong') ? (m.startsWith('</') ? '</b>' : '<b>') : m.startsWith('</') ? '</i>' : '<i>'
  );
  return t;
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
