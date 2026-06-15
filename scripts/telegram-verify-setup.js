#!/usr/bin/env node
/**
 * Verify Telegram bot + channel connection.
 * Usage: node --env-file=.env.local scripts/telegram-verify-setup.js
 */

const token = (process.env.TELEGRAM_BOT_TOKEN || '').trim();
const chatId = (process.env.TELEGRAM_CHANNEL_ID || process.env.TELEGRAM_GROUP_ID || '').trim();

async function api(method, body) {
  const res = await fetch(`https://api.telegram.org/bot${token}/${method}`, {
    method: body ? 'POST' : 'GET',
    headers: body ? { 'Content-Type': 'application/json' } : {},
    body: body ? JSON.stringify(body) : undefined,
  });
  return res.json();
}

async function main() {
  if (!token) {
    console.error('TELEGRAM_BOT_TOKEN is required');
    process.exit(1);
  }
  if (!chatId) {
    console.error('TELEGRAM_CHANNEL_ID or TELEGRAM_GROUP_ID is required');
    process.exit(1);
  }

  const me = await api('getMe');
  if (!me.ok) {
    console.error('getMe failed:', me.description);
    process.exit(1);
  }

  console.log('Bot:', `@${me.result.username} (${me.result.first_name})`);

  const chat = await api('getChat', { chat_id: chatId });
  if (!chat.ok) {
    console.error('getChat failed:', chat.description);
    process.exit(1);
  }

  console.log('Channel:', chat.result.title, `(${chat.result.id})`);

  const member = await api('getChatMember', { chat_id: chatId, user_id: me.result.id });
  if (!member.ok) {
    console.error('getChatMember failed:', member.description);
    process.exit(1);
  }

  const status = member.result.status;
  const canPost = member.result.can_post_messages;
  console.log('Bot role:', status, canPost === false ? '(cannot post!)' : canPost === true ? '(can post)' : '');

  if (status !== 'administrator' || canPost === false) {
    console.error('\nAdd @' + me.result.username + ' as channel admin with "Post messages" permission.');
    process.exit(1);
  }

  const test = await api('sendMessage', {
    chat_id: chatId,
    text: '✅ <b>STRATUM IELTS Writing bot connected</b>\n\nDaily tips + essay check in DM are live.\n<a href="https://stratumielts.com/">stratumielts.com</a>',
    parse_mode: 'HTML',
    disable_web_page_preview: true,
  });

  if (!test.ok) {
    console.error('sendMessage failed:', test.description);
    process.exit(1);
  }

  console.log('Test post OK, message_id:', test.result.message_id);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
