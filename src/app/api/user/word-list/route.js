export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { safeAuth } from '@/lib/safeAuth';
import { formatHistoryDbError } from '@/lib/historyChecks';
import {
  getWordListForUser,
  replaceWordListForUser,
} from '@/lib/userLibraryServer.js';

export async function GET() {
  const session = await safeAuth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { getPrisma, withPrismaRetry } = await import('@/lib/prisma');
    const items = await withPrismaRetry(() => getWordListForUser(getPrisma(), session.user.id));
    return NextResponse.json({ items });
  } catch (err) {
    console.error('[/api/user/word-list GET]', err);
    return NextResponse.json({ error: formatHistoryDbError(err) }, { status: 503 });
  }
}

export async function PUT(request) {
  const session = await safeAuth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  try {
    const { getPrisma } = await import('@/lib/prisma');
    const items = await replaceWordListForUser(
      getPrisma(),
      session.user.id,
      body?.items
    );
    return NextResponse.json({ items });
  } catch (err) {
    console.error('[/api/user/word-list PUT]', err);
    return NextResponse.json({ error: formatHistoryDbError(err) }, { status: 503 });
  }
}
