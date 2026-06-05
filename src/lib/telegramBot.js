import { sendTelegramMessage } from '@/lib/telegram';
import {
  buildResourceMessage,
  buildStartMessage,
  buildTipMessage,
  buildTopicMessage,
} from '@/lib/telegramContent';

function commandFromText(text) {
  const first = String(text || '').trim().split(/\s+/)[0]?.toLowerCase() || '';
  if (!first.startsWith('/')) return '';
  return first.split('@')[0];
}

function replyForCommand(cmd) {
  switch (cmd) {
    case '/start':
    case '/help':
      return buildStartMessage();
    case '/tip':
      return buildTipMessage();
    case '/topic':
      return buildTopicMessage();
    case '/resource':
      return buildResourceMessage();
    default:
      return null;
  }
}

/** @param {import('telegram').Message} message */
export async function handleTelegramMessage(message) {
  const chatId = message?.chat?.id;
  const text = message?.text;
  if (!chatId || !text) return { handled: false };

  const cmd = commandFromText(text);
  let reply = cmd ? replyForCommand(cmd) : null;

  if (!reply && text.startsWith('/')) {
    reply = 'Неизвестная команда. Доступны: /start /tip /topic /resource /help';
  }

  if (!reply) return { handled: false };

  const result = await sendTelegramMessage(chatId, reply);
  return { handled: true, ok: result.ok, cmd: cmd || text };
}

/** @param {object} update */
export async function handleTelegramUpdate(update) {
  if (update?.message) {
    return handleTelegramMessage(update.message);
  }
  return { handled: false };
}
