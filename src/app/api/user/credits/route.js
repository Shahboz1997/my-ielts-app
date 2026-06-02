export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { safeAuth } from '@/lib/safeAuth';
import { formatHistoryDbError } from '@/lib/historyChecks';
import { normalizeCreditsBalance } from '@/lib/credits';

/** Current essay-check balance (one lightweight DB read; avoids session.update() storms). */
export async function GET() {
  const session = await safeAuth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { getPrisma, withPrismaRetry } = await import('@/lib/prisma');
    const row = await withPrismaRetry(() =>
      getPrisma().user.findUnique({
        where: { id: session.user.id },
        select: { credits: true },
      })
    );
    return NextResponse.json({
      credits: normalizeCreditsBalance(row?.credits),
    });
  } catch (err) {
    console.error('[/api/user/credits GET]', err);
    return NextResponse.json({ error: formatHistoryDbError(err) }, { status: 503 });
  }
}
