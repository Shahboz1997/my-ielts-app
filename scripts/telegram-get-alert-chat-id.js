#!/usr/bin/env node
/**
 * Find your Telegram user id for TELEGRAM_ALERT_CHAT_ID (Facebook failure alerts).
 *
 * 1. Open @Stratum_ielts_writing_bot in Telegram and send /start
 * 2. node --env-file=.env.local scripts/telegram-get-alert-chat-id.js
 */

const token = (process.env.TELEGRAM_BOT_TOKEN || '').trim();
if (!token) {
  console.error('TELEGRAM_BOT_TOKEN is required in .env.local');
  process.exit(1);
}

const res = await fetch(`https://api.telegram.org/bot${token}/getUpdates?limit=20`);
const data = await res.json();

if (!data.ok) {
  console.error('getUpdates failed:', data.description || res.status);
  process.exit(1);
}

const privateChats = (data.result || [])
  .map((u) => u.message?.chat || u.edited_message?.chat)
  .filter((c) => c && c.type === 'private');

if (!privateChats.length) {
  console.log('No private messages yet.');
  console.log('Send /start to your bot in Telegram, then run this script again.');
  process.exit(0);
}

const seen = new Set();
console.log('=== Copy one id into .env.local + Vercel ===\n');
for (const chat of privateChats) {
  if (seen.has(chat.id)) continue;
  seen.add(chat.id);
  const name = [chat.first_name, chat.last_name].filter(Boolean).join(' ') || chat.username || 'user';
  console.log(`TELEGRAM_ALERT_CHAT_ID=${chat.id}  # ${name}${chat.username ? ` (@${chat.username})` : ''}`);
}
