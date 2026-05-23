export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import { getHistoryCheckForUser } from '@/lib/historyChecks';

export async function GET(_request, { params }) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const resolved = await params;
  const id = typeof resolved?.id === 'string' ? resolved.id : resolved?.id?.[0];
  if (!id) {
    return NextResponse.json({ error: 'Missing id' }, { status: 400 });
  }

  try {
    const check = await getHistoryCheckForUser(session.user.id, id);
    if (!check) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }
    return NextResponse.json({ check });
  } catch (err) {
    console.error('[/api/history/[id]] error:', err);
    return NextResponse.json(
      { error: err?.message || 'Database unavailable' },
      { status: 503 }
    );
  }
}
