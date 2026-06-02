import { NextResponse } from 'next/server';

/**
 * Vercel Cron sends `Authorization: Bearer <CRON_SECRET>` when CRON_SECRET is set.
 * Manual triggers: `curl -H "Authorization: Bearer $CRON_SECRET" https://…/api/cron/practice-reminders`
 */
export function verifyCronRequest(request) {
  const secret = (process.env.CRON_SECRET || '').trim();
  if (!secret) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: 'CRON_SECRET is not configured' },
        { status: 503 }
      ),
    };
  }

  const authHeader = request.headers.get('authorization') || '';
  const match = /^Bearer\s+(.+)$/i.exec(authHeader);
  const token = match?.[1]?.trim();

  if (token && token === secret) {
    return { ok: true };
  }

  return {
    ok: false,
    response: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }),
  };
}
