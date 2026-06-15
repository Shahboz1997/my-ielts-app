#!/usr/bin/env node
/** Send a one-off test post to the Telegram channel. */
const token = (process.env.TELEGRAM_BOT_TOKEN || '').trim();
const chatId = (process.env.TELEGRAM_CHANNEL_ID || process.env.TELEGRAM_GROUP_ID || '').trim();

const text = [
  '🧪 <b>Bot check — STRATUM IELTS Writing</b>',
  '',
  'If you see this, the bot can post to the channel.',
  '',
  'DM commands:',
  '• /check — essay scores',
  '• /tip — morning tip',
  '• /topic — practice prompt',
  '• /resource — study links',
  '',
  '<a href="https://stratumielts.com/">stratumielts.com</a>',
].join('\n');

async function main() {
  const me = await fetch(`https://api.telegram.org/bot${token}/getMe`).then((r) => r.json());
  if (!me.ok) throw new Error(me.description || 'getMe failed');
  console.log('Bot:', `@${me.result.username}`);

  const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: chatId,
      text,
      parse_mode: 'HTML',
      disable_web_page_preview: true,
    }),
  });
  const data = await res.json();
  if (!data.ok) throw new Error(data.description || 'sendMessage failed');
  console.log('Posted to channel, message_id:', data.result.message_id);
}

main().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});
