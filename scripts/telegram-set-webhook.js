#!/usr/bin/env node
/**
 * Register Telegram webhook after deploy.
 *
 * Usage (from project root, with .env.local loaded):
 *   node --env-file=.env.local scripts/telegram-set-webhook.js
 *
 * Or set TELEGRAM_WEBHOOK_URL explicitly to production origin + /api/telegram/webhook
 */

const token = (process.env.TELEGRAM_BOT_TOKEN || '').trim();
const secret = (process.env.TELEGRAM_WEBHOOK_SECRET || '').trim();

function siteOrigin() {
  const raw =
    process.env.TELEGRAM_WEBHOOK_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.AUTH_URL ||
    process.env.NEXTAUTH_URL ||
    '';
  if (process.env.TELEGRAM_WEBHOOK_URL) return process.env.TELEGRAM_WEBHOOK_URL.trim();
  const base = String(raw).trim().replace(/\/$/, '');
  if (!base) return '';
  return `${base}/api/telegram/webhook`;
}

async function main() {
  if (!token) {
    console.error('TELEGRAM_BOT_TOKEN is required');
    process.exit(1);
  }

  const webhookUrl = siteOrigin();
  if (!webhookUrl.startsWith('https://')) {
    console.error(
      'Webhook URL must be HTTPS. Set NEXTAUTH_URL to your production domain or TELEGRAM_WEBHOOK_URL=https://your-domain/api/telegram/webhook'
    );
    process.exit(1);
  }

  const body = { url: webhookUrl, allowed_updates: ['message'] };
  if (secret) body.secret_token = secret;

  const res = await fetch(`https://api.telegram.org/bot${token}/setWebhook`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await res.json();

  if (!data.ok) {
    console.error('setWebhook failed:', data.description || data);
    process.exit(1);
  }

  console.log('Webhook registered:', webhookUrl);
  if (secret) console.log('Secret token: configured');

  const commandsRes = await fetch(`https://api.telegram.org/bot${token}/setMyCommands`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      commands: [
        { command: 'start', description: 'Welcome & link to STRATUM.ai' },
        { command: 'tip', description: 'Task 1/2 template tip' },
        { command: 'topic', description: 'Random essay prompt' },
        { command: 'resource', description: 'Useful study link' },
        { command: 'help', description: 'Command list' },
      ],
    }),
  });
  const commandsData = await commandsRes.json();
  if (commandsData.ok) console.log('Bot commands registered');

  const info = await fetch(`https://api.telegram.org/bot${token}/getWebhookInfo`).then((r) => r.json());
  console.log('Webhook info:', JSON.stringify(info.result, null, 2));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
