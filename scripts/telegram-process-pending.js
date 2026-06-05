#!/usr/bin/env node
/**
 * Process pending Telegram updates once (no webhook needed).
 * Use after /start while webhook is not registered yet.
 *
 *   node --env-file=.env.local scripts/telegram-process-pending.js
 */

const token = (process.env.TELEGRAM_BOT_TOKEN || '').trim();
const appOrigin =
  (process.env.NEXT_PUBLIC_APP_URL || process.env.NEXTAUTH_URL || 'https://startum-writing-ai.vercel.app')
    .replace(/\/$/, '');

if (!token) {
  console.error('TELEGRAM_BOT_TOKEN is required');
  process.exit(1);
}

const START_TEXT = [
  '👋 <b>Добро пожаловать в STRATUM IELTS Writing!</b>',
  '',
  'Бот присылает полезные материалы для подготовки к IELTS Writing.',
  '',
  '<b>Команды:</b>',
  '/tip — совет по шаблону',
  '/topic — случайная тема для эссе',
  '/resource — полезная ссылка',
  '',
  `✍️ <a href="${appOrigin}/?utm_source=telegram&utm_medium=bot&utm_campaign=start">Открыть STRATUM.ai</a>`,
].join('\n');

async function tgGet(method, params = {}) {
  const url = new URL(`https://api.telegram.org/bot${token}/${method}`);
  for (const [k, v] of Object.entries(params)) {
    if (v != null && v !== '') url.searchParams.set(k, String(v));
  }
  const res = await fetch(url);
  const data = await res.json();
  if (!data.ok) throw new Error(data.description || method);
  return data.result;
}

async function tgPost(method, body) {
  const res = await fetch(`https://api.telegram.org/bot${token}/${method}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!data.ok) throw new Error(data.description || method);
  return data.result;
}

function command(text) {
  const first = String(text || '').trim().split(/\s+/)[0]?.toLowerCase() || '';
  return first.startsWith('/') ? first.split('@')[0] : '';
}

async function main() {
  const updates = await tgGet('getUpdates');
  if (!updates.length) {
    console.log('No pending updates.');
    return;
  }

  for (const u of updates) {
    const msg = u.message;
    if (!msg?.chat?.id || !msg.text) continue;
    const cmd = command(msg.text);
    if (cmd === '/start' || cmd === '/help' || msg.text.startsWith('/')) {
      await tgPost('sendMessage', {
        chat_id: msg.chat.id,
        text: START_TEXT,
        parse_mode: 'HTML',
      });
      console.log('Replied to', msg.from?.username || msg.chat.id, cmd || msg.text);
    }
  }

  const lastId = updates[updates.length - 1].update_id;
  await tgGet('getUpdates', { offset: lastId + 1 });
  console.log('Cleared', updates.length, 'pending update(s).');
}

main().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});
