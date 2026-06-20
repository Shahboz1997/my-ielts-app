export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { verifyCronRequest } from '@/lib/cronAuth';
import { getFacebookErrorAlertHint } from '@/lib/facebook';
import { publishWritingPostToFacebook } from '@/lib/facebookPublish';
import { notifyFacebookCrossPostFailure } from '@/lib/telegram';

/**
 * Facebook-only IELTS Writing post (no Telegram side effects).
 * Auth: Authorization: Bearer <CRON_SECRET>
 *
 * Query: ?variant=1|2  (image prompt variant, default 1)
 *
 * Example:
 *   curl -H "Authorization: Bearer $CRON_SECRET" \
 *     "https://stratumielts.com/api/cron/facebook-post?variant=1"
 */
export async function GET(request) {
  const auth = verifyCronRequest(request);
  if (!auth.ok) return auth.response;

  if (process.env.FACEBOOK_USE_AI !== '1') {
    return NextResponse.json(
      { ok: false, error: 'FACEBOOK_USE_AI is not enabled' },
      { status: 503 }
    );
  }

  const params = new URL(request.url).searchParams;
  const variantParam = params.get('variant') ?? '1';
  const variant = ['1', '2'].includes(variantParam) ? Number(variantParam) : 1;

  try {
    console.log('[cron/facebook-post] Publishing IELTS Writing post, variant', variant);
    const result = await publishWritingPostToFacebook({ variant });

    if (!result.success) {
      const error = String(result.error ?? 'Facebook post failed');
      console.warn('[cron/facebook-post] Failed:', error);
      await notifyFacebookCrossPostFailure({
        slot: 'facebook-writing',
        error,
        hint: getFacebookErrorAlertHint(error),
      });
      return NextResponse.json({ ok: false, variant, error }, { status: 502 });
    }

    const summary = { ok: true, variant, facebookPostId: result.facebookPostId };
    console.log('[cron/facebook-post]', summary);
    return NextResponse.json(summary);
  } catch (err) {
    const error = err?.message || String(err);
    console.warn('[cron/facebook-post] Error:', error);
    await notifyFacebookCrossPostFailure({
      slot: 'facebook-writing',
      error,
      hint: getFacebookErrorAlertHint(error),
    });
    return NextResponse.json({ ok: false, variant, error }, { status: 500 });
  }
}
