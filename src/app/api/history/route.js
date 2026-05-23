export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import {
  formatHistoryDbError,
  getHistoryChecksForUser,
  HISTORY_PAGE_SIZE,
} from '@/lib/historyChecks';

export async function GET(request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const page = Math.max(1, Number.parseInt(searchParams.get('page') || '1', 10) || 1);
  const pageSize = Math.min(
    50,
    Math.max(1, Number.parseInt(searchParams.get('pageSize') || String(HISTORY_PAGE_SIZE), 10) || HISTORY_PAGE_SIZE)
  );
  const q = searchParams.get('q') || '';
  const minScore = searchParams.get('minScore') || '0';
  const sort = searchParams.get('sort') === 'asc' ? 'asc' : 'desc';

  try {
    const result = await getHistoryChecksForUser(session.user.id, {
      page,
      pageSize,
      q,
      minScore,
      sort,
    });
    return NextResponse.json(result);
  } catch (err) {
    console.error('[/api/history] error:', err);
    return NextResponse.json({ error: formatHistoryDbError(err) }, { status: 503 });
  }
}
