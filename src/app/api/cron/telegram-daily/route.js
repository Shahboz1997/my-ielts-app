export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { verifyCronRequest } from '@/lib/cronAuth';
import { isTelegramConfigured, sendToGroup } from '@/lib/telegram';
import { buildDailyPost } from '@/lib/telegramDailyContent';

/**
 * Daily Telegram group posts — morning & evening.
 * Auth: Authorization: Bearer <CRON_SECRET>
 *
 * Query: ?slot=morning|evening  (required)
 *
 * Vercel crons (UTC, ~ Moscow +3):
 *   morning  0 5 * * *  → ~08:00 MSK
 *   evening  0 16 * * * → ~19:00 MSK
 */
export async function GET(request) {
  const auth = verifyCronRequest(request);
  if (!auth.ok) return auth.response;

  if (!isTelegramConfigured()) {
    console.warn('[cron/telegram-daily] TELEGRAM_BOT_TOKEN missing; skip');
    return NextResponse.json(
      { ok: false, error: 'TELEGRAM_BOT_TOKEN missing' },
      { status: 503 }
    );
  }

  const slotParam = new URL(request.url).searchParams.get('slot')?.toLowerCase();
  const slot = slotParam === 'evening' ? 'evening' : slotParam === 'morning' ? 'morning' : null;

  if (!slot) {
    return NextResponse.json(
      { ok: false, error: 'Query param slot=morning or slot=evening is required' },
      { status: 400 }
    );
  }

  const text = buildDailyPost(slot, new Date());
  const result = await sendToGroup(text);

  if (!result.ok) {
    console.warn('[cron/telegram-daily]', slot, 'send failed', result.error);
    return NextResponse.json(
      { ok: false, slot, error: result.error || 'send failed' },
      { status: result.error?.includes('GROUP') || result.error?.includes('CHANNEL') ? 503 : 502 }
    );
  }

  const summary = {
    ok: true,
    slot,
    sent: true,
    messageId: result.data?.result?.message_id,
  };
  console.log('[cron/telegram-daily]', summary);
  return NextResponse.json(summary);
}
