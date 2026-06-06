export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { safeAuth } from '@/lib/safeAuth';
import {
  createTelegramLinkToken,
  disconnectTelegram,
  getBotUsername,
  getTelegramLinkStatus,
} from '@/lib/telegramLink';
import { isTelegramConfigured } from '@/lib/telegram';

export async function GET() {
  const session = await safeAuth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!isTelegramConfigured()) {
    return NextResponse.json({
      configured: false,
      linked: false,
      practiceRemindersTelegramEnabled: false,
    });
  }

  try {
    const status = await getTelegramLinkStatus(session.user.id);
    const botUsername = await getBotUsername();
    return NextResponse.json({
      configured: true,
      botUsername,
      ...status,
    });
  } catch (e) {
    return NextResponse.json({ error: e?.message || 'Server error' }, { status: 500 });
  }
}

export async function POST() {
  const session = await safeAuth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!isTelegramConfigured()) {
    return NextResponse.json({ error: 'Telegram bot not configured' }, { status: 503 });
  }

  try {
    const { linkUrl, expiresInMinutes } = await createTelegramLinkToken(session.user.id);
    if (!linkUrl) {
      return NextResponse.json({ error: 'Could not resolve bot username' }, { status: 503 });
    }
    return NextResponse.json({ linkUrl, expiresInMinutes });
  } catch (e) {
    return NextResponse.json({ error: e?.message || 'Server error' }, { status: 500 });
  }
}

export async function DELETE() {
  const session = await safeAuth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    await disconnectTelegram(session.user.id);
    return NextResponse.json({ ok: true, linked: false });
  } catch (e) {
    return NextResponse.json({ error: e?.message || 'Server error' }, { status: 500 });
  }
}
