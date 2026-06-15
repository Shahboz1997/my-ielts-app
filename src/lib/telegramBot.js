import {
  appendStratumSiteLink,
  buildCtaInlineKeyboard,
  prepareTelegramHtml,
  sendTelegramMessage,
  sendTelegramMessageParts,
} from '@/lib/telegram';
import { checkEssayForTelegram } from '@/lib/telegramEssayCheck';
import {
  buildResourceMessage,
  buildStartMessage,
  buildTipMessage,
  buildTopicMessage,
} from '@/lib/telegramContent';
import { PRODUCTION_SITE_ORIGIN } from '@/lib/publicSiteUrl';

const CHECK_START_TEXT = [
  '✅ <b>Check my text</b>',
  '',
  'Paste your IELTS Writing Task 1 or Task 2 essay (plain text).',
  'Deep check: band scores, error highlights, C1/C2 vocabulary, idea depth, Band 9 rewrite excerpt.',
  '',
  'Optional: paste the <b>task question</b> on the line above the essay for sharper Task Achievement scoring.',
  '',
  'Minimum ~80 words. Task 1: 150+ · Task 2: 250+ for exam-realistic feedback.',
].join('\n');

const CHECK_BUSY_TEXT =
  '⏳ Running a <b>deep</b> IELTS check (same engine as stratum)… Usually 60–90 seconds.';
const CHECK_AI_OFF =
  'AI checking is temporarily unavailable. Open stratum for full feedback on your writing.';

function commandFromText(text) {
  const parts = String(text || '').trim().split(/\s+/);
  const first = parts[0]?.toLowerCase() || '';
  if (!first.startsWith('/')) return { cmd: '', args: '' };
  const cmd = first.split('@')[0];
  const args = parts.slice(1).join(' ').trim();
  return { cmd, args };
}

function wordCount(text) {
  return String(text || '')
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;
}

function replyForCommand(cmd, args) {
  switch (cmd) {
    case '/start':
      if (args === 'check' || args.startsWith('check_')) {
        return { text: CHECK_START_TEXT };
      }
      return buildStartMessage();
    case '/help':
      return buildStartMessage();
    case '/check':
      return { text: CHECK_START_TEXT };
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

  const isPrivate = message?.chat?.type === 'private';
  const { cmd, args } = commandFromText(text);
  let reply = cmd ? replyForCommand(cmd, args) : null;

  if (!reply && text.startsWith('/')) {
    reply = { text: 'Unknown command. Try /start /check /tip /topic /resource /help' };
  }

  if (!reply && isPrivate && !text.startsWith('/')) {
    if (wordCount(text) >= 80) {
      await sendTelegramMessage(chatId, CHECK_BUSY_TEXT, { parse_mode: 'HTML' });
      const result = await checkEssayForTelegram(text);
      if (result?.messages?.length) {
        const parts = result.messages.map((m) => {
          const sanitized = prepareTelegramHtml(m);
          return sanitized.includes('Full highlighted rewrite on stratum')
            ? appendStratumSiteLink(sanitized)
            : sanitized;
        });
        const cta = buildCtaInlineKeyboard(
          PRODUCTION_SITE_ORIGIN,
          '👉 Full rewrite + highlights on stratum'
        );
        const sent = await sendTelegramMessageParts(chatId, parts, {
          parse_mode: 'HTML',
          reply_markup: cta,
        });
        return { handled: true, ok: sent.ok, cmd: 'essay-deep' };
      }
      if (result?.text) {
        reply = { text: prepareTelegramHtml(result.text) };
      } else {
        reply = { text: CHECK_AI_OFF };
      }
    } else {
      reply = {
        text:
          'Send at least 80 words for essay feedback, or use:\n/check — check essay\n/tip · /topic · /resource',
      };
    }
  }

  if (!reply) return { handled: false };

  const payload =
    typeof reply === 'string'
      ? { text: reply }
      : { text: reply.text, replyMarkup: reply.replyMarkup };

  const result = await sendTelegramMessage(chatId, payload.text, {
    parse_mode: 'HTML',
    ...(payload.replyMarkup ? { reply_markup: payload.replyMarkup } : {}),
  });
  return { handled: true, ok: result.ok, cmd: cmd || 'essay' };
}

/** @param {object} update */
export async function handleTelegramUpdate(update) {
  if (update?.message) {
    return handleTelegramMessage(update.message);
  }
  return { handled: false };
}
