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
  return callTelegramApi('sendMessage', {
    chat_id: chatId,
    text,
    parse_mode: 'HTML',
    disable_web_page_preview: false,
    ...options,
  });
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
