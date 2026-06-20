export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { verifyCronRequest } from '@/lib/cronAuth';
import {
  isTelegramConfigured,
  notifyFacebookCrossPostFailure,
  sendQuizPollToGroup,
  sendToGroup,
} from '@/lib/telegram';
import { adaptTelegramTextForFacebook, getFacebookErrorAlertHint, postImageToFacebookPage } from '@/lib/facebook';
import { generatePostBanner } from '@/lib/facebookImageGen';
import { buildDailyPostAsync } from '@/lib/telegramDailyContent';

const FB_BANNER_TOPICS = {
  morning: 'IELTS grammar tip',
  evening: 'IELTS writing task 2 prompt',
};

async function reportFacebookCrossPostFailure(slot, error) {
  const message = typeof error === 'string' ? error : error?.message || String(error);
  await notifyFacebookCrossPostFailure({
    slot,
    error: message,
    hint: getFacebookErrorAlertHint(message),
  });
}

/**
 * Daily Telegram group posts — morning & evening.
 * Auth: Authorization: Bearer <CRON_SECRET>
 *
 * Query: ?slot=morning|evening  (required)
 *
 * Features: HTML formatting, inline CTA button, evening quiz poll.
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

  const post = await buildDailyPostAsync(slot, new Date());

  const sendOpts = {
    parse_mode: post.parseMode || 'HTML',
    reply_markup: post.replyMarkup,
  };

  let result = await sendToGroup(post.text, sendOpts);

  if (!result.ok && post.parseMode) {
    console.warn('[cron/telegram-daily] HTML send failed, retry plain', result.error);
    result = await sendToGroup(post.text.replace(/<[^>]+>/g, ''), {
      reply_markup: post.replyMarkup,
    });
  }

  if (!result.ok) {
    console.warn('[cron/telegram-daily]', slot, 'send failed', result.error);
    return NextResponse.json(
      { ok: false, slot, error: result.error || 'send failed' },
      { status: result.error?.includes('GROUP') || result.error?.includes('CHANNEL') ? 503 : 502 }
    );
  }

  let pollMessageId;
  if (post.poll) {
    const pollOpts = post.pollScheduleDate ? { scheduleDate: post.pollScheduleDate } : {};
    const pollResult = await sendQuizPollToGroup(post.poll, pollOpts);
    if (pollResult.ok) {
      pollMessageId = pollResult.data?.result?.message_id;
    } else {
      console.warn('[cron/telegram-daily] poll send failed', pollResult.error);
    }
  }

  const summary = {
    ok: true,
    slot,
    sent: true,
    source: post.source,
    messageId: result.data?.result?.message_id,
    pollMessageId: pollMessageId ?? null,
  };

  if (process.env.FACEBOOK_USE_AI === '1') {
    try {
      console.log('[cron/telegram-daily] Facebook cross-post starting…');
      const bannerTopic = FB_BANNER_TOPICS[slot];
      const image = await generatePostBanner(bannerTopic);
      const fbText = adaptTelegramTextForFacebook(post.text);
      const fbResult = await postImageToFacebookPage(image, fbText);
      if (fbResult.success) {
        summary.facebookPostId = fbResult.id;
        console.log('[cron/telegram-daily] Facebook post id:', fbResult.id);
      } else {
        summary.facebookError = fbResult.error;
        console.warn('[cron/telegram-daily] Facebook post failed (non-blocking)', fbResult.error);
        await reportFacebookCrossPostFailure(slot, fbResult.error);
      }
    } catch (fbErr) {
      console.warn(
        '[cron/telegram-daily] Facebook cross-post error (non-blocking):',
        fbErr?.message || fbErr
      );
      summary.facebookError = fbErr?.message || String(fbErr);
      await reportFacebookCrossPostFailure(slot, summary.facebookError);
    }
  }

  console.log('[cron/telegram-daily]', summary);
  return NextResponse.json(summary);
}
