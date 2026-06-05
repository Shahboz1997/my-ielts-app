export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { isTelegramConfigured } from '@/lib/telegram';
import { handleTelegramUpdate } from '@/lib/telegramBot';

function verifyWebhookSecret(request) {
  const expected = (process.env.TELEGRAM_WEBHOOK_SECRET || '').trim();
  if (!expected) return true;
  const header = request.headers.get('x-telegram-bot-api-secret-token') || '';
  return header === expected;
}

export async function POST(request) {
  if (!isTelegramConfigured()) {
    return NextResponse.json({ error: 'Telegram not configured' }, { status: 503 });
  }

  if (!verifyWebhookSecret(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let update;
  try {
    update = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  try {
    await handleTelegramUpdate(update);
  } catch (err) {
    console.error('[telegram/webhook]', err);
  }

  return NextResponse.json({ ok: true });
}
