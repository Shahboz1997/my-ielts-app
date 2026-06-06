import { sendTelegramMessage } from '@/lib/telegram';

/**
 * Sends practice reminder DM. Requires TELEGRAM_BOT_TOKEN + user telegramChatId.
 */
export async function sendPracticeReminderTelegram({ chatId, name, locale }) {
  const token = (process.env.TELEGRAM_BOT_TOKEN || '').trim();
  if (!token) {
    console.warn('[reminderTelegram] TELEGRAM_BOT_TOKEN missing; skip send');
    return { ok: false, reason: 'no_bot_token' };
  }
  if (!chatId) {
    return { ok: false, reason: 'no_chat_id' };
  }

  const isRu = locale === 'ru';
  const baseUrl = (process.env.NEXTAUTH_URL || 'https://stratumielts.com').replace(/\/$/, '');
  const greeting = name ? `${name}, ` : '';

  const text = isRu
    ? `${greeting}⏰ <b>Напоминание о практике</b>\n\nКороткая сессия IELTS Writing сегодня поможет удержать темп.\n\n<a href="${baseUrl}/">Открыть Writer</a> · <a href="${baseUrl}/study-plan">План</a>`
    : `${greeting}⏰ <b>Practice reminder</b>\n\nA short IELTS Writing session today helps you stay on track.\n\n<a href="${baseUrl}/">Open Writer</a> · <a href="${baseUrl}/study-plan">Study plan</a>`;

  try {
    const res = await sendTelegramMessage(chatId, text, {
      parse_mode: 'HTML',
      disable_web_page_preview: false,
    });
    if (!res.ok) {
      return { ok: false, reason: res.error || 'send_failed' };
    }
    return { ok: true };
  } catch (err) {
    console.error('[reminderTelegram]', err?.message || err);
    return { ok: false, reason: err?.message || 'send_failed' };
  }
}
