#!/usr/bin/env node
/**
 * Full Telegram bot setup: commands, description, webhook.
 * Usage: node --env-file=.env.local scripts/telegram-migrate-bot.js
 */

const token = (process.env.TELEGRAM_BOT_TOKEN || '').trim();
const secret = (process.env.TELEGRAM_WEBHOOK_SECRET || '').trim();
const chatId = (process.env.TELEGRAM_CHANNEL_ID || process.env.TELEGRAM_GROUP_ID || '').trim();

const PRODUCTION_WEBHOOK = 'https://stratumielts.com/api/telegram/webhook';

const COMMANDS = [
  { command: 'start', description: 'Welcome & link to stratumielts.com' },
  { command: 'check', description: 'Check your essay (AI feedback)' },
  { command: 'tip', description: 'Task 1/2 template tip' },
  { command: 'topic', description: 'Random essay prompt' },
  { command: 'resource', description: 'Useful study link' },
  { command: 'help', description: 'Command list' },
];

const DESCRIPTION =
  'IELTS Writing checker — paste your Task 1 or Task 2 essay for band scores (TA, CC, LR, GRA), vocabulary upgrades, and rewrite tips.';

const SHORT_DESCRIPTION = 'IELTS Writing AI checker — /check your essay';

async function api(method, body) {
  const res = await fetch(`https://api.telegram.org/bot${token}/${method}`, {
    method: body ? 'POST' : 'GET',
    headers: body ? { 'Content-Type': 'application/json' } : {},
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json();
  if (!data.ok) throw new Error(`${method}: ${data.description || JSON.stringify(data)}`);
  return data.result;
}

async function main() {
  if (!token) {
    console.error('TELEGRAM_BOT_TOKEN is required');
    process.exit(1);
  }

  const me = await api('getMe');
  console.log(`Bot: @${me.username} (${me.first_name})`);

  await api('setMyCommands', { commands: COMMANDS });
  console.log('Commands:', COMMANDS.map((c) => `/${c.command}`).join(', '));

  await api('setMyDescription', { description: DESCRIPTION });
  console.log('Description set');

  await api('setMyShortDescription', { short_description: SHORT_DESCRIPTION });
  console.log('Short description set');

  const webhookBody = {
    url: PRODUCTION_WEBHOOK,
    allowed_updates: ['message'],
    drop_pending_updates: true,
  };
  if (secret) webhookBody.secret_token = secret;
  await api('setWebhook', webhookBody);
  console.log('Webhook:', PRODUCTION_WEBHOOK);

  const info = await api('getWebhookInfo');
  console.log('Pending updates:', info.pending_update_count ?? 0);

  if (chatId) {
    try {
      const member = await api('getChatMember', { chat_id: chatId, user_id: me.id });
      const canPost = member.can_post_messages;
      console.log('Channel role:', member.status, canPost === true ? '(can post)' : canPost === false ? '(cannot post!)' : '');
      if (member.status !== 'administrator' || canPost === false) {
        console.warn(`Add @${me.username} as channel admin with "Post messages" permission.`);
      } else {
        const posted = await api('sendMessage', {
          chat_id: chatId,
          parse_mode: 'HTML',
          disable_web_page_preview: true,
          text: [
            `✅ <b>Bot migrated — @${me.username}</b>`,
            '',
            'Commands in DM:',
            '• /check — essay scores',
            '• /tip — IELTS tip',
            '• /topic — practice prompt',
            '• /resource — study link',
            '• /help — command list',
            '',
            '<a href="https://stratumielts.com/">stratumielts.com</a>',
          ].join('\n'),
        });
        console.log('Channel test post:', posted.message_id);
      }
    } catch (err) {
      console.warn('Channel check skipped:', err.message);
    }
  }

  const listed = await api('getMyCommands');
  console.log('Verified commands:', listed.map((c) => `/${c.command}`).join(', '));
}

main().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});
