export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { revalidateTag } from 'next/cache';
import { safeAuth } from '@/lib/safeAuth';
import { getHistoryCheckForUser, formatHistoryDbError } from '@/lib/historyChecks';
import { getPrisma } from '@/lib/prisma';
import { writingProfileTag } from '@/lib/writingProfileCache.js';

export async function GET(_request, { params }) {
  const session = await safeAuth();
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

export async function PATCH(request, { params }) {
  const session = await safeAuth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const resolved = await params;
  const id = typeof resolved?.id === 'string' ? resolved.id : resolved?.id?.[0];
  if (!id) {
    return NextResponse.json({ error: 'Missing id' }, { status: 400 });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const scoreRaw = body?.score;
  const scoreNum =
    scoreRaw === null || scoreRaw === undefined ? null : Number(scoreRaw);
  if (scoreNum !== null && !Number.isFinite(scoreNum)) {
    return NextResponse.json({ error: 'Invalid score' }, { status: 400 });
  }

  let feedbackValue = body?.feedback;
  if (feedbackValue === undefined) {
    return NextResponse.json({ error: 'Missing feedback' }, { status: 400 });
  }
  if (typeof feedbackValue === 'string') {
    try {
      feedbackValue = JSON.parse(feedbackValue);
    } catch {
      return NextResponse.json({ error: 'Invalid feedback JSON' }, { status: 400 });
    }
  }

  try {
    const prisma = getPrisma();
    const existing = await prisma.check.findFirst({
      where: { id, userId: session.user.id },
      select: { id: true },
    });
    if (!existing) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    const updated = await prisma.check.update({
      where: { id },
      data: {
        ...(scoreNum !== null ? { score: scoreNum } : {}),
        feedback: feedbackValue,
      },
      select: { id: true, score: true },
    });

    try {
      revalidateTag(writingProfileTag(session.user.id));
    } catch (_) {}

    return NextResponse.json({
      ok: true,
      id: updated.id,
      score: updated.score != null ? Number(updated.score) : null,
    });
  } catch (err) {
    console.error('[/api/history/[id]] PATCH error:', err);
    return NextResponse.json(
      { error: formatHistoryDbError(err) },
      { status: 503 }
    );
  }
}
